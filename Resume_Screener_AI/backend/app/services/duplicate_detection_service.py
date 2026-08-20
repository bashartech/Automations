import hashlib
import math
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.orm import CandidateProfile, CandidateDuplicate, DuplicateStatus
from app.repositories.candidate_repository import CandidateRepository

EMBEDDING_SIMILARITY_THRESHOLD = 0.95


class DuplicateDetectionService:
    def __init__(self, db: AsyncSession):
        self.repo = CandidateRepository(db)

    async def check(self, profile: CandidateProfile) -> List[CandidateProfile]:
        return await self.repo.find_duplicates_for(
            email=profile.email,
            phone=profile.phone,
            linkedin=profile.linkedin,
            github=profile.github,
        )

    async def get_all_flags(self, profile: CandidateProfile) -> List[dict]:
        results = []
        exact = await self.check(profile)
        for dup in exact:
            sim = self.compute_text_similarity(profile.raw_text, dup.raw_text)
            results.append({
                "candidate": dup,
                "similarity": sim,
                "method": "exact",
            })
        embed = await self.check_embedding(profile, company_id=profile.company_id)
        for dup, sim in embed:
            already = any(r["candidate"].id == dup.id for r in results)
            if not already:
                results.append({
                    "candidate": dup,
                    "similarity": sim,
                    "method": "embedding",
                })
        results.sort(key=lambda r: r["similarity"], reverse=True)
        return results

    async def check_embedding(self, profile: CandidateProfile, company_id: Optional[str] = None) -> List[tuple[CandidateProfile, float]]:
        if not profile.embedding or not isinstance(profile.embedding, list) or len(profile.embedding) == 0:
            return []

        query = select(CandidateProfile).where(
            CandidateProfile.embedding.isnot(None),
            CandidateProfile.id != profile.id,
        )
        if company_id:
            query = query.where(CandidateProfile.company_id == company_id)

        result = await self.repo.db.execute(query)
        all_profiles: List[CandidateProfile] = list(result.scalars().all())

        matches: List[tuple[CandidateProfile, float]] = []
        for other in all_profiles:
            if not other.embedding or not isinstance(other.embedding, list):
                continue
            sim = self._cosine_similarity(profile.embedding, other.embedding)
            if sim >= EMBEDDING_SIMILARITY_THRESHOLD:
                matches.append((other, sim))

        matches.sort(key=lambda x: x[1], reverse=True)
        return matches

    async def create_duplicate_record(
        self, candidate_1: CandidateProfile, candidate_2: CandidateProfile,
        similarity: float, method: str = "exact", commit: bool = True
    ) -> CandidateDuplicate:
        result = await self.repo.db.execute(
            select(CandidateDuplicate).where(
                or_(
                    and_(
                        CandidateDuplicate.candidate_id_1 == candidate_1.id,
                        CandidateDuplicate.candidate_id_2 == candidate_2.id,
                    ),
                    and_(
                        CandidateDuplicate.candidate_id_1 == candidate_2.id,
                        CandidateDuplicate.candidate_id_2 == candidate_1.id,
                    ),
                ),
                CandidateDuplicate.method == method,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.similarity = similarity
            if commit:
                await self.repo.db.commit()
                await self.repo.db.refresh(existing)
            return existing

        dup = CandidateDuplicate(
            candidate_id_1=candidate_1.id,
            candidate_id_2=candidate_2.id,
            similarity=similarity,
            duplicate_status=DuplicateStatus.PENDING_REVIEW,
            method=method,
        )
        self.repo.db.add(dup)
        if commit:
            await self.repo.db.commit()
            await self.repo.db.refresh(dup)
        return dup

    @staticmethod
    def compute_text_similarity(text1: Optional[str], text2: Optional[str]) -> float:
        if not text1 or not text2:
            return 0.0
        t1 = text1.lower().strip()
        t2 = text2.lower().strip()
        if t1 == t2:
            return 1.0
        set1 = set(t1.split())
        set2 = set(t2.split())
        if not set1 or not set2:
            return 0.0
        intersection = set1 & set2
        union = set1 | set2
        return len(intersection) / len(union)

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        if len(a) != len(b) or not a:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
