import asyncio
import logging
import time
import traceback
from typing import List, Optional
from datetime import datetime, timezone
from app.celery_app import celery_app
from app.database import async_session
from app.repositories.candidate_repository import CandidateRepository
from app.services.profile_extraction_service import ProfileExtractionService
from app.services.combined_analysis_agent import CombinedAnalysisAgent
from app.services.duplicate_detection_service import DuplicateDetectionService
from app.services.quality_agent import QualityAgent
from app.services.embedding_service import GeminiEmbeddingService
from sqlalchemy import select
from app.models.orm import ProcessingJob, ProcessingStatus, CandidateProfile
from app.services.credit_service import deduct_credits
from app.services.notification_service import NotificationService
from app.services.activity_log_service import ActivityLogService
from app.models.orm import NotificationType
from app.services.logging_service import CorrelationLogger, FailedTaskService, TaskLogService

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, acks_late=True, reject_on_worker_lost=True,
                 autoretry_for=(),
                 retry_backoff=30, retry_backoff_max=120)
def process_resume_file(self, job_id: str, file_index: int,
                        job_description: str = ""):
    cl = CorrelationLogger()
    start = time.monotonic()
    try:
        text = asyncio.run(_get_extracted_text(job_id, file_index))

        resume_id = f"{job_id}_{file_index}"
        cl.info("Processing resume", resume_id=resume_id, job_id=job_id)
        asyncio.run(_process_single_resume(text, resume_id, job_id, file_index, job_description, cl))

        duration = int((time.monotonic() - start) * 1000)
        asyncio.run(_log_task("process_resume_file", "success", cl.correlation_id,
                              entity_id=resume_id, duration_ms=duration))
        return {"status": "success", "file_index": file_index}
    except Exception as exc:
        duration = int((time.monotonic() - start) * 1000)
        cl.error("Resume processing failed: %s: %s\n%s", type(exc).__name__, exc, traceback.format_exc())
        is_rate_limit = "429" in str(exc) or "RateLimitError" in type(exc).__name__
        if not is_rate_limit and self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
        try:
            asyncio.run(_increment_failed(job_id))
        except Exception:
            pass
        asyncio.run(_record_failed_task(
            "process_resume_file", str(exc), cl.correlation_id,
            task_id=self.request.id, entity_id=f"{job_id}_{file_index}",
        ))
        asyncio.run(_log_task("process_resume_file", "failed", cl.correlation_id,
                              entity_id=f"{job_id}_{file_index}", duration_ms=duration,
                              message=str(exc)))
        return {"status": "failed", "file_index": file_index, "error": str(exc)}


async def _get_extracted_text(job_id: str, file_index: int) -> str:
    async with async_session() as db:
        result = await db.execute(
            select(ProcessingJob.raw_texts).where(ProcessingJob.id == job_id)
        )
        raw_texts = result.scalar_one_or_none()
        if raw_texts and str(file_index) in raw_texts:
            return raw_texts[str(file_index)]
        return ""


async def _log_task(task_name: str, status: str, correlation_id: Optional[str] = None,
                    entity_id: Optional[str] = None, duration_ms: Optional[int] = None,
                    message: Optional[str] = None):
    try:
        async with async_session() as db:
            svc = TaskLogService(db)
            await svc.log(task_name, status, correlation_id=correlation_id,
                          entity_id=entity_id, duration_ms=duration_ms, message=message)
    except Exception:
        pass


async def _record_failed_task(task_name: str, error_message: str,
                               correlation_id: Optional[str] = None,
                               task_id: Optional[str] = None,
                               entity_id: Optional[str] = None):
    try:
        async with async_session() as db:
            svc = FailedTaskService(db)
            await svc.record(task_name, error_message, correlation_id=correlation_id,
                             task_id=task_id, entity_id=entity_id,
                             traceback_str=traceback.format_exc())
    except Exception:
        pass


async def _process_single_resume(text: str, resume_id: str, job_id: str, file_index: int,
                                  job_description: str, cl: CorrelationLogger):
    async with async_session() as db:
        repo = CandidateRepository(db)

        job = await repo.get_processing_job(job_id)
        user_id = job.user_id if job else None

        existing = await db.execute(
            select(CandidateProfile).where(CandidateProfile.resume_id == resume_id)
        )
        profile = existing.scalar_one_or_none()
        if not profile:
            extract_service = ProfileExtractionService(db, user_id)
            profile = await extract_service.extract(text, resume_id=resume_id, user_id=user_id)
            cl.info("Profile extracted", profile_id=profile.id)
        elif profile.overall_score is not None:
            cl.info("Already processed, counting toward progress")
            job = await repo.get_processing_job(job_id)
            if job:
                await repo.update_processing_job(job_id, {
                    "processed_files": job.processed_files + 1,
                })
            return

        quality_results = QualityAgent.check_all(text)
        quality_score = QualityAgent.score(quality_results)
        failed = QualityAgent.failed_flags(quality_results)
        if failed:
            profile = await repo.update_profile(profile.id, {
                "quality_flags": [r.to_dict() for r in quality_results],
            })
            cl.info("Quality flags set", flags=[r.check_type for r in quality_results if not r.passed])

        if job and job.file_paths and file_index < len(job.file_paths):
            file_path = job.file_paths[file_index]
            profile = await repo.update_profile(profile.id, {
                "resume_file_path": file_path,
            })

        try:
            embed_service = GeminiEmbeddingService()
            embedding = await embed_service.embed_text(text)
            profile = await repo.update_profile(profile.id, {"embedding": embedding})
            cl.info("Embedding generated")
        except Exception as e:
            cl.warning("Embedding failed, continuing: %s", e)

        dup_service = DuplicateDetectionService(db)
        exact_dups = await dup_service.check(profile)
        for dup in exact_dups:
            similarity = dup_service.compute_text_similarity(profile.raw_text, dup.raw_text)
            await dup_service.create_duplicate_record(profile, dup, similarity, method="exact", commit=False)

        embed_dups = await dup_service.check_embedding(profile, company_id=job.company_id if job else None)
        for dup, sim in embed_dups:
            already_flagged = any(d.id == dup.id for d in exact_dups)
            if not already_flagged:
                await dup_service.create_duplicate_record(profile, dup, sim, method="embedding", commit=False)
        await db.commit()
        cl.info("Duplicate check complete")

        if job_description.strip():
            try:
                job_record = await repo.get_processing_job(job_id)
                job_db_id = job_record.job_id if job_record and job_record.job_id else None
                agent = CombinedAnalysisAgent(db)
                await agent.analyze(profile.id, job_db_id, job_description)
                cl.info("Analysis complete")
            except Exception as e:
                cl.warning("Combined analysis failed, continuing: %s", e)

        if user_id:
            await deduct_credits(db, user_id, 1, "resume_processed")

        job = await repo.get_processing_job(job_id)
        if job:
            await repo.update_processing_job(job_id, {
                "processed_files": job.processed_files + 1,
            })
            if job.processed_files + job.failed_files + 1 >= job.total_files:
                await repo.update_processing_job(job_id, {
                    "status": ProcessingStatus.COMPLETED,
                })
                if not job.company_id:
                    cl.warning("Skipping notification: no company_id on job %s", job_id)
                else:
                    notif_svc = NotificationService(db, job.company_id)
                    await notif_svc.create(
                        type=NotificationType.PROCESSING_COMPLETE,
                        title="Resume Processing Complete",
                        message=f"Processed {job.total_files} resumes ({job.processed_files + 1} succeeded, {job.failed_files} failed)",
                        user_id=user_id,
                        link=f"/batches/{job_id}",
                    )
                    act_svc = ActivityLogService(db)
                    await act_svc.log(
                        action="batch_completed",
                        entity_type="processing_job",
                        entity_id=job_id,
                        company_id=job.company_id,
                        user_id=user_id,
                        details={"total": job.total_files, "processed": job.processed_files + 1, "failed": job.failed_files},
                    )
                    cl.info("Batch completed notification sent")


async def _increment_failed(job_id: str):
    async with async_session() as db:
        repo = CandidateRepository(db)
        job = await repo.get_processing_job(job_id)
        if job:
            await repo.update_processing_job(job_id, {
                "failed_files": job.failed_files + 1,
            })
            if job.processed_files + job.failed_files + 1 >= job.total_files:
                await repo.update_processing_job(job_id, {
                    "status": ProcessingStatus.COMPLETED,
                })
                if job.company_id:
                    notif_svc = NotificationService(db, job.company_id)
                    await notif_svc.create(
                        type=NotificationType.PROCESSING_COMPLETE,
                        title="Resume Processing Complete",
                        message=f"Processed {job.total_files} resumes ({job.processed_files} succeeded, {job.failed_files + 1} failed)",
                        user_id=job.user_id,
                        link=f"/batches/{job_id}",
                    )


@celery_app.task
def process_bulk_upload(file_paths: List[str], job_id: str, job_description: str = ""):
    for idx in range(len(file_paths)):
        process_resume_file.delay(job_id, idx, job_description)


@celery_app.task(bind=True, max_retries=2, acks_late=True)
def reanalyze_candidate(self, candidate_id: str, job_id: str, job_description: str):
    cl = CorrelationLogger()
    try:
        asyncio.run(_reanalyze_single(candidate_id, job_description, job_id, cl))
        return {"status": "success", "candidate_id": candidate_id}
    except Exception as exc:
        cl.error("Reanalyze failed: %s: %s\n%s", type(exc).__name__, exc, traceback.format_exc())
        is_rate_limit = "429" in str(exc) or "RateLimitError" in type(exc).__name__
        if not is_rate_limit and self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
        try:
            asyncio.run(_increment_failed(job_id))
        except Exception:
            pass
        asyncio.run(_record_failed_task(
            "reanalyze_candidate", str(exc), cl.correlation_id,
            task_id=self.request.id, entity_id=candidate_id,
        ))
        return {"status": "failed", "candidate_id": candidate_id, "error": str(exc)}


async def _reanalyze_single(candidate_id: str, job_description: str, job_id: str, cl: CorrelationLogger):
    async with async_session() as db:
        agent = CombinedAnalysisAgent(db)
        await agent.analyze(candidate_id, job_id, job_description)
        cl.info("Reanalysis complete", candidate_id=candidate_id)

        repo = CandidateRepository(db)
        job = await repo.get_processing_job(job_id)
        if job:
            await repo.update_processing_job(job_id, {"processed_files": job.processed_files + 1})
            if job.processed_files + job.failed_files + 1 >= job.total_files:
                await repo.update_processing_job(job_id, {
                    "status": ProcessingStatus.COMPLETED,
                })
