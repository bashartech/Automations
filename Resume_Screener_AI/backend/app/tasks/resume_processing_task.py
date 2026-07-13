import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from app.celery_app import celery_app
from app.services.ocr_service import OCRService
from app.database import async_session
from app.repositories.candidate_repository import CandidateRepository
from app.services.profile_extraction_service import ProfileExtractionService
from app.services.candidate_analysis_service import CandidateAnalysisService
from app.services.duplicate_detection_service import DuplicateDetectionService
from sqlalchemy import select
from app.models.orm import ProcessingStatus, CandidateProfile
from app.services.credit_service import deduct_credits


@celery_app.task(bind=True, max_retries=3, acks_late=True, reject_on_worker_lost=True,
                 autoretry_for=(),
                 retry_backoff=30, retry_backoff_max=120)
def process_resume_file(self, file_path: str, job_id: str, file_index: int,
                        job_description: str = ""):
    try:
        ocr = OCRService()
        text = ocr.extract_text(file_path)

        resume_id = f"{job_id}_{file_index}"
        asyncio.run(_process_single_resume(text, resume_id, job_id, job_description))

        return {"status": "success", "file_index": file_index}
    except Exception as exc:
        is_rate_limit = "429" in str(exc) or "RateLimitError" in type(exc).__name__
        if not is_rate_limit and self.request.retries < self.max_retries:
            try:
                self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
            except Exception:
                pass
        try:
            asyncio.run(_increment_failed(job_id))
        except Exception:
            pass
        return {"status": "failed", "file_index": file_index, "error": str(exc)}


async def _process_single_resume(text: str, resume_id: str, job_id: str, job_description: str):
    async with async_session() as db:
        repo = CandidateRepository(db)

        # Read user_id from the job so we can tag the profile
        job = await repo.get_processing_job(job_id)
        user_id = job.user_id if job else None

        existing = await db.execute(
            select(CandidateProfile).where(CandidateProfile.resume_id == resume_id)
        )
        profile = existing.scalar_one_or_none()
        if not profile:
            extract_service = ProfileExtractionService(db, user_id)
            profile = await extract_service.extract(text, resume_id=resume_id, user_id=user_id)
        else:
            if profile.overall_score is not None:
                return

        # Step 2: Check for duplicates
        dup_service = DuplicateDetectionService(db)
        duplicates = await dup_service.check(profile)
        for dup in duplicates:
            similarity = dup_service.compute_text_similarity(profile.raw_text, dup.raw_text)
            await dup_service.create_duplicate_record(profile, dup, similarity)

        # Step 3: If job description provided, run AI analysis + scoring + categorization
        if job_description.strip():
            analysis_service = CandidateAnalysisService(db)
            await analysis_service.analyze(profile.id, job_description)

        # Step 4: Deduct 1 credit for successful processing
        if user_id:
            await deduct_credits(db, user_id, 1, "resume_processed")

        # Step 5: Update job progress and check completion
        job = await repo.get_processing_job(job_id)
        if job:
            await repo.update_processing_job(job_id, {
                "processed_files": job.processed_files + 1,
            })
            if job.processed_files + job.failed_files + 1 >= job.total_files:
                await repo.update_processing_job(job_id, {
                    "status": ProcessingStatus.COMPLETED,
                })


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


@celery_app.task
def process_bulk_upload(file_paths: List[str], job_id: str, job_description: str = ""):
    for idx, fp in enumerate(file_paths):
        process_resume_file.delay(fp, job_id, idx, job_description)


@celery_app.task(bind=True, max_retries=2, acks_late=True)
def reanalyze_candidate(self, candidate_id: str, job_id: str, job_description: str):
    try:
        asyncio.run(_reanalyze_single(candidate_id, job_description, job_id))
        return {"status": "success", "candidate_id": candidate_id}
    except Exception as exc:
        is_rate_limit = "429" in str(exc) or "RateLimitError" in type(exc).__name__
        if not is_rate_limit and self.request.retries < self.max_retries:
            try:
                self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
            except Exception:
                pass
        try:
            asyncio.run(_increment_failed(job_id))
        except Exception:
            pass
        return {"status": "failed", "candidate_id": candidate_id, "error": str(exc)}


async def _reanalyze_single(candidate_id: str, job_description: str, job_id: str):
    async with async_session() as db:
        analysis_service = CandidateAnalysisService(db)
        await analysis_service.analyze(candidate_id, job_description)

        repo = CandidateRepository(db)
        job = await repo.get_processing_job(job_id)
        if job:
            await repo.update_processing_job(job_id, {"processed_files": job.processed_files + 1})
            if job.processed_files + job.failed_files + 1 >= job.total_files:
                await repo.update_processing_job(job_id, {
                    "status": ProcessingStatus.COMPLETED,
                })
