from typing import List, Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import Interview, InterviewSlot, InterviewStatus


class InterviewRepository:
    def __init__(self, db: AsyncSession, company_id: str):
        self.db = db
        self.company_id = company_id

    # ── Interview Slots ──

    async def create_slot(self, slot: InterviewSlot) -> InterviewSlot:
        slot.company_id = self.company_id
        self.db.add(slot)
        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def get_slot(self, slot_id: str) -> Optional[InterviewSlot]:
        result = await self.db.execute(
            select(InterviewSlot).where(
                InterviewSlot.id == slot_id,
                InterviewSlot.company_id == self.company_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_slots(self, day_of_week: Optional[int] = None) -> List[InterviewSlot]:
        query = select(InterviewSlot).where(InterviewSlot.company_id == self.company_id)
        if day_of_week is not None:
            query = query.where(InterviewSlot.day_of_week == day_of_week)
        query = query.order_by(InterviewSlot.day_of_week, InterviewSlot.start_time)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_slot(self, slot_id: str, data: dict) -> Optional[InterviewSlot]:
        slot = await self.get_slot(slot_id)
        if not slot:
            return None
        for key, value in data.items():
            if hasattr(slot, key):
                setattr(slot, key, value)
        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def delete_slot(self, slot_id: str) -> bool:
        slot = await self.get_slot(slot_id)
        if not slot:
            return False
        await self.db.delete(slot)
        await self.db.commit()
        return True

    # ── Interviews ──

    async def create_interview(self, interview: Interview) -> Interview:
        interview.company_id = self.company_id
        self.db.add(interview)
        await self.db.commit()
        await self.db.refresh(interview)
        return interview

    async def get_interview(self, interview_id: str) -> Optional[Interview]:
        result = await self.db.execute(
            select(Interview).where(
                Interview.id == interview_id,
                Interview.company_id == self.company_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_interviews(self, job_id: Optional[str] = None,
                               candidate_id: Optional[str] = None,
                               status: Optional[InterviewStatus] = None,
                               limit: int = 50, offset: int = 0) -> List[Interview]:
        query = select(Interview).where(Interview.company_id == self.company_id)
        if job_id:
            query = query.where(Interview.job_id == job_id)
        if candidate_id:
            query = query.where(Interview.candidate_id == candidate_id)
        if status:
            query = query.where(Interview.status == status)
        query = query.order_by(Interview.date.desc(), Interview.time.desc())
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_interview(self, interview_id: str, data: dict) -> Optional[Interview]:
        interview = await self.get_interview(interview_id)
        if not interview:
            return None
        for key, value in data.items():
            if hasattr(interview, key):
                setattr(interview, key, value)
        await self.db.commit()
        await self.db.refresh(interview)
        return interview

    async def cancel_interview(self, interview_id: str) -> Optional[Interview]:
        return await self.update_interview(interview_id, {
            "status": InterviewStatus.CANCELLED,
        })

    async def get_upcoming_interviews(self, within_minutes: int = 60) -> List[Interview]:
        query = select(Interview).where(
            Interview.company_id == self.company_id,
            Interview.status == InterviewStatus.SCHEDULED,
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_interviews_for_reminder(self, before_hours: int) -> List[Interview]:
        query = select(Interview).where(
            Interview.company_id == self.company_id,
            Interview.status == InterviewStatus.SCHEDULED,
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
