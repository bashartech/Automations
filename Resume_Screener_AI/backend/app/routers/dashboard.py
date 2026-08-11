from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from sqlalchemy import select, func, or_
from app.repositories.candidate_repository import CandidateRepository
from app.models.orm import CandidateDuplicate, CandidateProfile, User, Job, Interview, ProcessingJob, CandidateScore
from app.models.candidate_schemas import DashboardMetrics
from app.dependencies import get_current_user
from sqlalchemy import cast, Float

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db),
                                current_user: User = Depends(get_current_user)):
    company_id = current_user.company_id
    repo = CandidateRepository(db, current_user.id)

    total = await repo.count_profiles()
    strong = await repo.count_profiles(category="strong_match")
    good = await repo.count_profiles(category="good_match")
    average = await repo.count_profiles(category="average_match")
    weak = await repo.count_profiles(category="weak_match")
    reject = await repo.count_profiles(category="reject")

    dup_result = await db.execute(
        select(func.count(CandidateDuplicate.id))
        .join(CandidateProfile, or_(
            CandidateDuplicate.candidate_id_1 == CandidateProfile.id,
            CandidateDuplicate.candidate_id_2 == CandidateProfile.id,
        ))
        .where(CandidateProfile.user_id == current_user.id)
        .distinct()
    )
    dup_count = dup_result.scalar() or 0

    avg_score_result = await db.execute(
        select(func.avg(CandidateScore.overall_score))
        .select_from(CandidateProfile)
        .join(CandidateScore, CandidateScore.candidate_id == CandidateProfile.id)
        .where(CandidateProfile.user_id == current_user.id)
    )
    avg_score = avg_score_result.scalar() or 0

    total_jobs = 0
    total_interviews = 0
    total_selected = 0
    total_rejected = 0
    avg_processing = 0
    top_skills = []
    funnel: dict[str, int] = {}

    if company_id:
        jobs_count = await db.execute(
            select(func.count(Job.id)).where(Job.company_id == company_id)
        )
        total_jobs = jobs_count.scalar() or 0

        interviews_count = await db.execute(
            select(func.count(Interview.id)).where(Interview.company_id == company_id)
        )
        total_interviews = interviews_count.scalar() or 0

        proc_result = await db.execute(
            select(
                func.avg(
                    cast(func.extract('epoch', ProcessingJob.completed_at), Float) -
                    cast(func.extract('epoch', ProcessingJob.started_at), Float)
                )
            ).where(
                ProcessingJob.company_id == company_id,
                ProcessingJob.status == "completed",
                ProcessingJob.completed_at.isnot(None),
                ProcessingJob.started_at.isnot(None),
            )
        )
        avg_processing = proc_result.scalar() or 0

    all_profiles = await db.execute(
        select(CandidateProfile.status).where(CandidateProfile.user_id == current_user.id)
    )
    statuses = [row[0] for row in all_profiles.all() if row[0]]
    total_candidates = len(statuses)
    total_rejected = sum(1 for s in statuses if s == "rejected")
    total_selected = sum(1 for s in statuses if s in ("shortlisted", "interview"))

    funnel = {
        "applications": total_candidates,
        "shortlisted": sum(1 for s in statuses if s == "shortlisted"),
        "interview": sum(1 for s in statuses if s == "interview"),
        "rejected": total_rejected,
    }

    skills_data = await db.execute(
        select(CandidateProfile.skills).where(
            CandidateProfile.user_id == current_user.id,
            CandidateProfile.skills.isnot(None),
        )
    )
    skill_counter: dict[str, int] = {}
    for row in skills_data.all():
        skills = row[0]
        if skills and isinstance(skills, list):
            for s in skills:
                if isinstance(s, str):
                    skill_counter[s] = skill_counter.get(s, 0) + 1
    top_skills = sorted(skill_counter, key=skill_counter.get, reverse=True)[:10]

    return DashboardMetrics(
        total_resumes=total,
        processed_resumes=total,
        strong_matches=strong,
        duplicate_candidates=dup_count,
        average_match_score=round(avg_score, 1) if avg_score else 0,
        category_distribution={
            "strong_match": strong,
            "good_match": good,
            "average_match": average,
            "weak_match": weak,
            "reject": reject,
        },
        total_jobs=total_jobs,
        total_candidates=total_candidates,
        total_interviews=total_interviews,
        total_rejected=total_rejected,
        total_selected=total_selected,
        avg_processing_time_seconds=round(avg_processing, 1) if avg_processing else 0,
        top_skills=top_skills,
        funnel=funnel,
    )
