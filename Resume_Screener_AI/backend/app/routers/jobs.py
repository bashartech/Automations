import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import update as sa_update
from app.database import get_db
from app.models.orm import Job, UserRole, JobStatus
from app.models.candidate_schemas import JobCreate, JobUpdate, JobResponse, JDReviewResponse, JDReviewRequest
from app.dependencies import get_current_user, require_role
from app.services.jd_agent import JDAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/companies", tags=["jobs"])


async def _get_job(db: AsyncSession, company_id: str, job_id: str) -> Job | None:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    return result.scalar_one_or_none()


@router.get("/{company_id}/jobs", response_model=list[JobResponse])
async def list_jobs(
    company_id: str,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    query = select(Job).where(Job.company_id == company_id)
    if status:
        query = query.where(Job.status == status)
    query = query.order_by(Job.created_at.desc())

    result = await db.execute(query)
    return [JobResponse.model_validate(row) for row in result.scalars().all()]


@router.get("/{company_id}/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    company_id: str,
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = await _get_job(db, company_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)


@router.post("/{company_id}/jobs", response_model=JobResponse, status_code=201)
async def create_job(
    company_id: str,
    request: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.HR_RECRUITER, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = Job(
        id=str(uuid.uuid4()),
        company_id=company_id,
        department_id=request.department_id,
        title=request.title,
        employment_type=request.employment_type,
        location=request.location,
        remote_type=request.remote_type,
        experience_required=request.experience_required,
        salary_min=request.salary_min,
        salary_max=request.salary_max,
        currency=request.currency,
        num_openings=request.num_openings,
        application_deadline=request.application_deadline,
        required_skills=request.required_skills,
        preferred_skills=request.preferred_skills,
        responsibilities=request.responsibilities,
        qualifications=request.qualifications,
        benefits=request.benefits,
        description=request.description,
        status=JobStatus.APPROVED,
        created_by=current_user.id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    logger.info("Job %s created by user %s in company %s", job.id, current_user.id, company_id)
    return JobResponse.model_validate(job)


@router.patch("/{company_id}/jobs/{job_id}", response_model=JobResponse)
async def update_job(
    company_id: str,
    job_id: str,
    request: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.HR_RECRUITER, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = await _get_job(db, company_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        for field, value in update_data.items():
            setattr(job, field, value)
        await db.commit()
        await db.refresh(job)

    return JobResponse.model_validate(job)


@router.delete("/{company_id}/jobs/{job_id}", status_code=204)
async def delete_job(
    company_id: str,
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = await _get_job(db, company_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.delete(job)
    await db.commit()


@router.post("/{company_id}/jobs/review", response_model=JDReviewResponse)
async def review_job_draft(
    company_id: str,
    request: JDReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.HR_RECRUITER, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    agent = JDAgent()
    review = await agent.review(
        title=request.title,
        description=request.description,
        required_skills=request.required_skills,
    )

    return JDReviewResponse(**review)


@router.post("/{company_id}/jobs/{job_id}/review", response_model=JDReviewResponse)
async def review_job(
    company_id: str,
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.HR_RECRUITER, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = await _get_job(db, company_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    agent = JDAgent()
    review = await agent.review(
        title=job.title,
        description=job.description or "",
        required_skills=job.required_skills,
    )

    return JDReviewResponse(**review)


@router.post("/{company_id}/jobs/{job_id}/approve", response_model=JobResponse)
async def approve_job(
    company_id: str,
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    job = await _get_job(db, company_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == JobStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Job is already approved")

    job.status = JobStatus.APPROVED
    await db.commit()
    await db.refresh(job)

    logger.info("Job %s approved by user %s", job.id, current_user.id)
    return JobResponse.model_validate(job)
