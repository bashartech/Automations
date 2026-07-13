import hashlib
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import CandidateProfile, CandidateDuplicate, DuplicateStatus
from app.repositories.candidate_repository import CandidateRepository


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

    async def create_duplicate_record(self, candidate_1: CandidateProfile, candidate_2: CandidateProfile, similarity: float) -> CandidateDuplicate:
        dup = CandidateDuplicate(
            candidate_id_1=candidate_1.id,
            candidate_id_2=candidate_2.id,
            similarity=similarity,
            duplicate_status=DuplicateStatus.PENDING_REVIEW,
        )
        self.repo.db.add(dup)
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
