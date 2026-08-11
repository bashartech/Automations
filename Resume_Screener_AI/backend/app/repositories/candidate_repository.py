from typing import Optional, List
from sqlalchemy import select, func, update, delete, String
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import CandidateProfile, ProcessingJob, CandidateDuplicate, ScoringWeight, CandidateScore


class CandidateRepository:
    def __init__(self, db: AsyncSession, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id

    def _scope(self, query):
        if self.user_id:
            return query.where(CandidateProfile.user_id == self.user_id)
        return query

    def _scope_job(self, query):
        if self.user_id:
            return query.where(ProcessingJob.user_id == self.user_id)
        return query

    async def create_profile(self, profile: CandidateProfile) -> CandidateProfile:
        if self.user_id:
            profile.user_id = self.user_id
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def get_profile(self, profile_id: str) -> Optional[CandidateProfile]:
        query = self._scope(select(CandidateProfile).where(CandidateProfile.id == profile_id))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def search_profiles(self, limit: int = 50, offset: int = 0, category: Optional[str] = None,
                              resume_id: Optional[str] = None, min_score: Optional[float] = None,
                              status: Optional[str] = None,
                              search: Optional[str] = None) -> List[CandidateProfile]:
        query = self._scope(select(CandidateProfile))
        if category:
            query = query.where(CandidateProfile.category == category)
        if resume_id:
            query = query.where(CandidateProfile.resume_id.startswith(resume_id + "_"))
        if min_score is not None:
            query = query.where(CandidateProfile.overall_score >= min_score)
        if status:
            query = query.where(CandidateProfile.status == status)
        if search:
            pattern = f"%{search}%"
            query = query.where(
                CandidateProfile.name.ilike(pattern) |
                CandidateProfile.email.ilike(pattern) |
                func.cast(CandidateProfile.skills, type_=String).ilike(pattern)
            )
        query = query.order_by(CandidateProfile.overall_score.desc().nullslast(), CandidateProfile.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_profiles(self, category: Optional[str] = None) -> int:
        query = self._scope(select(func.count(CandidateProfile.id)))
        if category:
            query = query.where(CandidateProfile.category == category)
        result = await self.db.execute(query)
        return result.scalar()

    async def update_profile(self, profile_id: str, data: dict) -> Optional[CandidateProfile]:
        query = self._scope(update(CandidateProfile).where(CandidateProfile.id == profile_id))
        await self.db.execute(query.values(**data))
        await self.db.commit()
        return await self.get_profile(profile_id)

    async def delete_profile(self, profile_id: str):
        query = self._scope(delete(CandidateProfile).where(CandidateProfile.id == profile_id))
        await self.db.execute(query)
        await self.db.commit()

    async def get_scoring_weights(self) -> ScoringWeight:
        result = await self.db.execute(select(ScoringWeight).limit(1))
        weights = result.scalar_one_or_none()
        if not weights:
            weights = ScoringWeight()
            self.db.add(weights)
            await self.db.commit()
            await self.db.refresh(weights)
        return weights

    async def update_scoring_weights(self, data: dict) -> ScoringWeight:
        weights = await self.get_scoring_weights()
        for key, value in data.items():
            if hasattr(weights, key):
                setattr(weights, key, value)
        await self.db.commit()
        await self.db.refresh(weights)
        return weights

    async def find_duplicates_for(self, email: Optional[str], phone: Optional[str],
                                    linkedin: Optional[str], github: Optional[str]) -> List[CandidateProfile]:
        if not any([email, phone, linkedin, github]):
            return []
        conditions = []
        if email:
            conditions.append(CandidateProfile.email == email)
        if phone:
            conditions.append(CandidateProfile.phone == phone)
        if linkedin:
            conditions.append(CandidateProfile.linkedin == linkedin)
        if github:
            conditions.append(CandidateProfile.github == github)
        from sqlalchemy import or_
        query = self._scope(select(CandidateProfile).where(or_(*conditions)))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all_emails(self) -> List[str]:
        query = self._scope(select(CandidateProfile.email).where(CandidateProfile.email.isnot(None)))
        result = await self.db.execute(query)
        return [r[0] for r in result.all() if r[0]]

    async def create_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        if self.user_id:
            job.user_id = self.user_id
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_processing_job(self, job_id: str) -> Optional[ProcessingJob]:
        query = self._scope_job(select(ProcessingJob).where(ProcessingJob.id == job_id))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_processing_job(self, job_id: str, data: dict) -> Optional[ProcessingJob]:
        job = await self.get_processing_job(job_id)
        if not job:
            return None
        processed = data.get("processed_files")
        failed = data.get("failed_files")
        stmt = update(ProcessingJob).where(ProcessingJob.id == job_id)
        if processed is not None:
            stmt = stmt.values(processed_files=ProcessingJob.processed_files + 1)
        if failed is not None:
            stmt = stmt.values(failed_files=ProcessingJob.failed_files + 1)
        other_vals = {k: v for k, v in data.items() if k not in ("processed_files", "failed_files")}
        if other_vals:
            stmt = stmt.values(**other_vals)
        await self.db.execute(stmt)
        await self.db.commit()
        return await self.get_processing_job(job_id)

    async def list_processing_jobs(self) -> List[ProcessingJob]:
        query = self._scope_job(select(ProcessingJob).order_by(ProcessingJob.created_at.desc()))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete_processing_job(self, job_id: str):
        await self.db.execute(
            delete(CandidateProfile).where(CandidateProfile.resume_id.like(f"{job_id}_%"))
        )
        await self.db.execute(
            delete(ProcessingJob).where(ProcessingJob.id == job_id)
        )
        await self.db.commit()

    async def get_candidates_by_batch(self, job_id: str) -> List[CandidateProfile]:
        query = self._scope(
            select(CandidateProfile)
            .where(CandidateProfile.resume_id.like(f"{job_id}_%"))
            .order_by(CandidateProfile.overall_score.desc().nullslast())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete_profiles(self, profile_ids: List[str]):
        from sqlalchemy import delete as sa_delete
        query = self._scope(sa_delete(CandidateProfile).where(CandidateProfile.id.in_(profile_ids)))
        await self.db.execute(query)
        await self.db.commit()

    async def get_profiles_by_ids(self, profile_ids: List[str]) -> List[CandidateProfile]:
        query = self._scope(
            select(CandidateProfile).where(CandidateProfile.id.in_(profile_ids))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def upsert_candidate_score(self, score: CandidateScore) -> CandidateScore:
        existing = await self.db.execute(
            select(CandidateScore).where(
                CandidateScore.candidate_id == score.candidate_id,
                CandidateScore.job_id == score.job_id,
            )
        )
        existing_record = existing.scalar_one_or_none()
        if existing_record:
            for key, value in score.__dict__.items():
                if key != "_sa_instance_state" and value is not None:
                    setattr(existing_record, key, value)
            await self.db.commit()
            await self.db.refresh(existing_record)
            return existing_record
        self.db.add(score)
        await self.db.commit()
        await self.db.refresh(score)
        return score

    async def get_candidate_score(self, candidate_id: str, job_id: str) -> Optional[CandidateScore]:
        result = await self.db.execute(
            select(CandidateScore).where(
                CandidateScore.candidate_id == candidate_id,
                CandidateScore.job_id == job_id,
            )
        )
        return result.scalar_one_or_none()
