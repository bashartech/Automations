import logging
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.candidate_repository import CandidateRepository
from app.models.orm import ProcessingJob, ProcessingStatus, CandidateProfile, User
from app.models.candidate_schemas import ProcessingJobResponse
from app.tasks.resume_processing_task import process_resume_file, reanalyze_candidate
from app.dependencies import get_current_user
from app.services.credit_service import has_sufficient_credits, deduct_credits, get_credit_balance
from sqlalchemy import select, delete

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resumes/batches", tags=["batches"])


@router.get("", response_model=List[ProcessingJobResponse])
async def list_batches(db: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    jobs = await repo.list_processing_jobs()
    return [
        ProcessingJobResponse(
            id=j.id,
            status=j.status,
            total_files=j.total_files,
            processed_files=j.processed_files,
            failed_files=j.failed_files,
            job_description=j.job_description,
            file_paths=j.file_paths,
            started_at=j.started_at,
            completed_at=j.completed_at,
            created_at=j.created_at,
        )
        for j in jobs
    ]


@router.get("/{job_id}", response_model=ProcessingJobResponse)
async def get_batch(job_id: str, db: AsyncSession = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    job = await repo.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch not found")
    return ProcessingJobResponse(
        id=job.id,
        status=job.status,
        total_files=job.total_files,
        processed_files=job.processed_files,
        failed_files=job.failed_files,
        job_description=job.job_description,
        file_paths=job.file_paths,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
    )


@router.delete("/{job_id}")
async def delete_batch(job_id: str, db: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    job = await repo.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch not found")
    await repo.delete_processing_job(job_id)
    return {"message": f"Batch {job_id} and its candidates deleted"}


@router.post("/{job_id}/reanalyze")
async def reanalyze_batch(job_id: str, job_description: str = Form(...), db: AsyncSession = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    job = await repo.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch not found")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    # Prevent duplicate reanalyze calls
    if job.status == ProcessingStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="This batch is already being re-analyzed. Wait for it to complete.")

    candidates = await repo.get_candidates_by_batch(job_id)
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found in this batch")

    if not await has_sufficient_credits(db, current_user.id, len(candidates)):
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Need {len(candidates)} credits, you have {await get_credit_balance(db, current_user.id)}",
        )

    await deduct_credits(db, current_user.id, len(candidates), reason="reanalyze")

    # Reset counters and set new JD
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(ProcessingJob)
        .where(ProcessingJob.id == job_id)
        .values(status=ProcessingStatus.PROCESSING, job_description=job_description,
                processed_files=0, failed_files=0)
    )
    await db.commit()

    for c in candidates:
        reanalyze_candidate.delay(c.id, job_id, job_description)

    return {
        "message": f"Re-analyzing {len(candidates)} candidates with new job description",
        "candidate_count": len(candidates),
    }


@router.post("/{job_id}/retry")
async def retry_failed(job_id: str, db: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    job = await repo.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch not found")

    if job.status == ProcessingStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="This batch is already processing. Wait for it to complete.")

    total_files = job.total_files or 0
    if total_files == 0:
        raise HTTPException(status_code=400, detail="No files in this batch")

    missing_indices = []
    for idx in range(total_files):
        result = await db.execute(
            select(CandidateProfile).where(CandidateProfile.resume_id == f"{job_id}_{idx}")
        )
        profile = result.scalar_one_or_none()
        if profile and profile.overall_score is not None:
            continue
        if not job.raw_texts or str(idx) not in job.raw_texts:
            logger.warning("No extracted text for index %s in batch %s", idx, job_id)
            continue
        missing_indices.append(idx)

    if not missing_indices:
        return {"message": "No failed files to retry", "retried_count": 0}

    if not await has_sufficient_credits(db, current_user.id, len(missing_indices)):
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Need {len(missing_indices)} credits, you have {await get_credit_balance(db, current_user.id)}",
        )

    await repo.update_processing_job(job_id, {"status": ProcessingStatus.PROCESSING})
    jd = job.job_description or ""
    for idx in missing_indices:
        process_resume_file.delay(job_id, idx, jd)

    return {
        "message": f"Retrying {len(missing_indices)} failed files",
        "retried_count": len(missing_indices),
    }
