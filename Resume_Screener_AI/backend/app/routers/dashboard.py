from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from sqlalchemy import select, func, or_
from app.repositories.candidate_repository import CandidateRepository
from app.models.orm import CandidateDuplicate, CandidateProfile, User
from app.models.candidate_schemas import DashboardMetrics
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db),
                                current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)

    total = await repo.count_profiles()
    strong = await repo.count_profiles(category="strong_match")
    good = await repo.count_profiles(category="good_match")
    average = await repo.count_profiles(category="average_match")
    weak = await repo.count_profiles(category="weak_match")
    reject = await repo.count_profiles(category="reject")

    # Count duplicates scoped to current user's candidates
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

    return DashboardMetrics(
        total_resumes=total,
        processed_resumes=total,
        strong_matches=strong,
        duplicate_candidates=dup_count,
        average_match_score=0,
        category_distribution={
            "strong_match": strong,
            "good_match": good,
            "average_match": average,
            "weak_match": weak,
            "reject": reject,
        },
    )
