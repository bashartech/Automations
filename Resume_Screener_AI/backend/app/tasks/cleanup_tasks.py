import asyncio
import logging
import os
import shutil
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from app.celery_app import celery_app
from app.database import async_session
from app.models.orm import ProcessingJob, CandidateProfile, FailedTask
from app.config import get_settings

logger = logging.getLogger(__name__)

DAYS_TO_KEEP_FILES = 30
DAYS_TO_KEEP_FAILED_TASKS = 60
DAYS_TO_KEEP_ORPHANED_JOBS = 7


@celery_app.task
def cleanup_old_data():
    asyncio.run(_cleanup_old_data())


async def _cleanup_old_data():
    cutoff = datetime.now(timezone.utc) - timedelta(days=DAYS_TO_KEEP_FILES)
    async with async_session() as db:
        old_jobs = await db.execute(
            select(ProcessingJob).where(
                ProcessingJob.created_at < cutoff,
            )
        )
        for job in old_jobs.scalars().all():
            if job.file_paths:
                for fp in job.file_paths:
                    try:
                        if os.path.isfile(fp):
                            os.remove(fp)
                        elif os.path.isdir(fp):
                            shutil.rmtree(fp, ignore_errors=True)
                    except Exception as e:
                        logger.warning("Failed to remove file %s: %s", fp, e)
            await db.execute(delete(ProcessingJob).where(ProcessingJob.id == job.id))
        await db.commit()

    failed_cutoff = datetime.now(timezone.utc) - timedelta(days=DAYS_TO_KEEP_FAILED_TASKS)
    async with async_session() as db:
        await db.execute(
            delete(FailedTask).where(
                FailedTask.created_at < failed_cutoff,
                FailedTask.resolved == True,
            )
        )
        await db.commit()
