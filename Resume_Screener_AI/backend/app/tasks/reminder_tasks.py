import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from app.celery_app import celery_app
from app.database import async_session
from app.models.orm import Interview, InterviewStatus, CandidateProfile

logger = logging.getLogger(__name__)


@celery_app.task
def send_24h_reminders():
    asyncio.run(_send_reminders(hours_before=24))


@celery_app.task
def send_1h_reminders():
    asyncio.run(_send_reminders(hours_before=1))


async def _send_reminders(hours_before: int):
    async with async_session() as db:
        result = await db.execute(
            select(Interview).where(
                Interview.status == InterviewStatus.SCHEDULED,
            )
        )
        interviews = list(result.scalars().all())

        now = datetime.now(timezone.utc)
        for interview in interviews:
            try:
                dt = datetime.strptime(f"{interview.date} {interview.time}", "%Y-%m-%d %H:%M")
                dt = dt.replace(tzinfo=timezone.utc)
                diff_hours = (dt - now).total_seconds() / 3600
                if hours_before - 1 < diff_hours <= hours_before + 1:
                    cand_result = await db.execute(
                        select(CandidateProfile).where(CandidateProfile.id == interview.candidate_id)
                    )
                    candidate = cand_result.scalar_one_or_none()
                    logger.info(
                        "REMINDER (%dh): Interview at %s %s %s for %s",
                        hours_before, interview.date, interview.time, interview.timezone,
                        candidate.name if candidate else interview.candidate_id,
                    )
            except Exception as e:
                logger.warning("Failed to process reminder for interview %s: %s", interview.id, e)
