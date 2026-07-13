import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.repositories.candidate_repository import CandidateRepository
from app.services.profile_extraction_service import ProfileExtractionService
from app.services.candidate_analysis_service import CandidateAnalysisService
from app.services.duplicate_detection_service import DuplicateDetectionService
from app.models.candidate_schemas import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    ProfileExtractRequest,
    ProfileExtractResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    WeightsUpdate,
    WeightsResponse,
    DuplicateReviewRequest,
    BulkActionRequest,
    CompareRequest,
)
from sqlalchemy import update as sa_update
from app.models.orm import DuplicateStatus, User, CandidateDuplicate
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


def _repo(db, user: User = None):
    return CandidateRepository(db, user.id if user else None)


@router.post("/extract", response_model=ProfileExtractResponse)
async def extract_profile(request: ProfileExtractRequest, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    try:
        service = ProfileExtractionService(db, current_user.id)
        profile = await service.extract(request.text, request.resume_id)
        dup_service = DuplicateDetectionService(db)
        duplicates = await dup_service.check(profile)
        for dup in duplicates:
            similarity = dup_service.compute_text_similarity(profile.raw_text, dup.raw_text)
            await dup_service.create_duplicate_record(profile, dup, similarity)
        return ProfileExtractResponse(
            profile=CandidateProfileResponse.model_validate(profile),
            message="Profile extracted successfully",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[CandidateProfileResponse])
async def list_candidates(
    category: Optional[str] = Query(None),
    resume_id: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = _repo(db, current_user)
    if batch_id:
        profiles = await repo.get_candidates_by_batch(batch_id)
        return [CandidateProfileResponse.model_validate(p) for p in profiles]
    profiles = await repo.search_profiles(
        limit=limit, offset=offset, category=category,
        resume_id=resume_id, min_score=min_score, status=status,
    )
    return [CandidateProfileResponse.model_validate(p) for p in profiles]


@router.get("/{profile_id}", response_model=CandidateProfileResponse)
async def get_candidate(profile_id: str, db: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profile = await repo.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return CandidateProfileResponse.model_validate(profile)


@router.patch("/{profile_id}", response_model=CandidateProfileResponse)
async def update_candidate(profile_id: str, data: CandidateProfileUpdate, db: AsyncSession = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profile = await repo.update_profile(profile_id, data.model_dump(exclude_unset=True))
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return CandidateProfileResponse.model_validate(profile)


@router.delete("/{profile_id}")
async def delete_candidate(profile_id: str, db: AsyncSession = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profile = await repo.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await repo.delete_profile(profile_id)
    return {"message": "Candidate deleted"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_candidate(request: AnalyzeRequest, db: AsyncSession = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    try:
        service = CandidateAnalysisService(db)
        return await service.analyze(request.resume_id, request.job_description)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weights", response_model=WeightsResponse)
async def get_weights(db: AsyncSession = Depends(get_db)):
    repo = CandidateRepository(db)
    weights = await repo.get_scoring_weights()
    return WeightsResponse(
        skill_weight=weights.skill_weight,
        experience_weight=weights.experience_weight,
        education_weight=weights.education_weight,
        certification_weight=weights.certification_weight,
        project_weight=weights.project_weight,
    )


@router.put("/weights", response_model=WeightsResponse)
async def update_weights(weights: WeightsUpdate, db: AsyncSession = Depends(get_db)):
    repo = CandidateRepository(db)
    updated = await repo.update_scoring_weights(weights.model_dump(exclude_unset=True))
    return WeightsResponse(
        skill_weight=updated.skill_weight,
        experience_weight=updated.experience_weight,
        education_weight=updated.education_weight,
        certification_weight=updated.certification_weight,
        project_weight=updated.project_weight,
    )


@router.get("/{profile_id}/duplicates")
async def get_duplicates(profile_id: str, db: AsyncSession = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profile = await repo.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    dup_service = DuplicateDetectionService(db)
    duplicates = await dup_service.check(profile)
    return [
        {"id": d.id, "name": d.name, "email": d.email, "similarity": dup_service.compute_text_similarity(profile.raw_text, d.raw_text)}
        for d in duplicates if d.id != profile_id
    ]


@router.post("/duplicates/{duplicate_id}/review")
async def review_duplicate(duplicate_id: str, request: DuplicateReviewRequest, db: AsyncSession = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    dup = await db.get(DuplicateStatus, duplicate_id)
    if not dup:
        raise HTTPException(status_code=404, detail="Duplicate record not found")
    await repo.db.execute(
        sa_update(CandidateDuplicate)
        .where(CandidateDuplicate.id == duplicate_id)
        .values(duplicate_status=request.action)
    )
    await repo.db.commit()
    return {"message": "Duplicate review updated"}


# --- Phase 2: New endpoints ---

@router.post("/bulk/delete")
async def bulk_delete_candidates(request: BulkActionRequest, db: AsyncSession = Depends(get_db),
                                 current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    await repo.delete_profiles(request.ids)
    return {"message": f"Deleted {len(request.ids)} candidates"}


@router.post("/bulk/status")
async def bulk_update_status(request: BulkActionRequest, status: str = Query(...),
                              db: AsyncSession = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profiles = await repo.get_profiles_by_ids(request.ids)
    for p in profiles:
        await repo.update_profile(p.id, {"status": status})
    return {"message": f"Updated {len(profiles)} candidates to '{status}'"}


@router.post("/compare", response_model=List[CandidateProfileResponse])
async def compare_candidates(request: CompareRequest, db: AsyncSession = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    repo = _repo(db, current_user)
    profiles = await repo.get_profiles_by_ids(request.ids)
    if len(profiles) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 candidates to compare")
    return [CandidateProfileResponse.model_validate(p) for p in profiles]


@router.get("/export/csv")
async def export_candidates_csv(
    category: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = _repo(db, current_user)
    if batch_id:
        profiles = await repo.get_candidates_by_batch(batch_id)
    else:
        profiles = await repo.search_profiles(
            limit=2000, offset=0, category=category,
            min_score=min_score, status=status,
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Score", "Category", "Status", "Skills", "Summary"])
    for p in profiles:
        skills = ", ".join(p.skills) if p.skills else ""
        writer.writerow([p.name, p.email or "", p.phone or "",
                        f"{p.overall_score:.0f}" if p.overall_score is not None else "",
                        p.category.value if p.category else "", p.status or "",
                        skills, (p.summary or "")[:200]])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates_export.csv"},
    )
