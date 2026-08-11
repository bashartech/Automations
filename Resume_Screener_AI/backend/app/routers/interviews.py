import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.repositories.interview_repository import InterviewRepository
from app.repositories.candidate_repository import CandidateRepository
from app.models.orm import User, Interview, InterviewSlot, InterviewStatus, CandidateProfile
from app.models.candidate_schemas import (
    InterviewSlotCreate, InterviewSlotUpdate, InterviewSlotResponse,
    InterviewCreate, InterviewUpdate, InterviewResponse,
)
from app.dependencies import get_current_user, require_role
from app.services.calendar_service import CalendarService
from app.services.email_service import EmailService
from app.services.ics_service import ICSService
from app.services.notification_service import NotificationService
from app.services.activity_log_service import ActivityLogService
from app.models.orm import NotificationType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


def _repo(db: AsyncSession, company_id: str) -> InterviewRepository:
    return InterviewRepository(db, company_id)


def _calendar(db: AsyncSession, company_id: str) -> CalendarService:
    return CalendarService(db=db, company_id=company_id)


def _email(db: AsyncSession, company_id: str) -> EmailService:
    return EmailService(db=db, company_id=company_id)


# ── Slot Management ──


@router.get("/slots", response_model=List[InterviewSlotResponse])
async def list_slots(
    day_of_week: Optional[int] = Query(None, ge=0, le=6),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = _repo(db, current_user.company_id)
    slots = await repo.list_slots(day_of_week)
    return [InterviewSlotResponse.model_validate(s) for s in slots]


@router.post("/slots", response_model=InterviewSlotResponse, status_code=201)
async def create_slot(
    data: InterviewSlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])
    repo = _repo(db, current_user.company_id)
    slot = InterviewSlot(
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        is_available=data.is_available,
    )
    slot = await repo.create_slot(slot)
    return InterviewSlotResponse.model_validate(slot)


@router.patch("/slots/{slot_id}", response_model=InterviewSlotResponse)
async def update_slot(
    slot_id: str,
    data: InterviewSlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])
    repo = _repo(db, current_user.company_id)
    slot = await repo.update_slot(slot_id, data.model_dump(exclude_unset=True))
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return InterviewSlotResponse.model_validate(slot)


@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])
    repo = _repo(db, current_user.company_id)
    deleted = await repo.delete_slot(slot_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Slot deleted"}


# ── Interview Scheduling ──


@router.get("/", response_model=List[InterviewResponse])
async def list_interviews(
    job_id: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = _repo(db, current_user.company_id)
    status_enum = InterviewStatus(status) if status else None
    interviews = await repo.list_interviews(
        job_id=job_id, candidate_id=candidate_id,
        status=status_enum, limit=limit, offset=offset,
    )
    result = []
    for iv in interviews:
        resp = InterviewResponse.model_validate(iv)
        cand_result = await db.execute(
            select(CandidateProfile.name).where(CandidateProfile.id == iv.candidate_id)
        )
        name = cand_result.scalar_one_or_none()
        resp.candidate_name = name
        result.append(resp)
    return result


@router.get("/candidates")
async def candidate_options(
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cand_repo = CandidateRepository(db, current_user.id)
    profiles = await cand_repo.search_profiles(limit=limit, offset=0, search=search)
    return [
        {"id": p.id, "name": p.name, "email": p.email, "overall_score": p.overall_score}
        for p in profiles
    ]


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = _repo(db, current_user.company_id)
    interview = await repo.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    resp = InterviewResponse.model_validate(interview)
    cand_result = await db.execute(
        select(CandidateProfile.name).where(CandidateProfile.id == interview.candidate_id)
    )
    name = cand_result.scalar_one_or_none()
    resp.candidate_name = name
    return resp


@router.post("/", response_model=InterviewResponse, status_code=201)
async def schedule_interview(
    data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])

    cand_repo = CandidateRepository(db, current_user.id)
    candidate = await cand_repo.get_profile(data.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cal = _calendar(db, current_user.company_id)
    meet_link = await cal.create_meet_link(
        summary=f"Interview with {candidate.name or data.candidate_id}",
        date=data.date, time=data.time, timezone=data.timezone,
    )

    interview = Interview(
        job_id=data.job_id,
        candidate_id=data.candidate_id,
        date=data.date,
        time=data.time,
        timezone=data.timezone,
        meeting_link=meet_link,
        interviewer=data.interviewer,
        interview_round=data.interview_round,
        notes=data.notes,
    )
    repo = _repo(db, current_user.company_id)
    interview = await repo.create_interview(interview)

    ics_content = ICSService.generate(
        summary=f"Interview with {candidate.name or data.candidate_id}",
        description=f"Interview for candidate {candidate.name or data.candidate_id}",
        date=data.date, time=data.time, timezone_str=data.timezone,
        attendee=candidate.email or "",
    )

    email_svc = _email(db, current_user.company_id)
    await email_svc.send_interview_email(
        to_email=candidate.email or "",
        candidate_name=candidate.name or "Candidate",
        date=data.date, time=data.time, timezone=data.timezone,
        meet_link=meet_link or "",
        interviewer=data.interviewer,
        notes=data.notes,
    )

    notif_svc = NotificationService(db, current_user.company_id)
    await notif_svc.create(
        type=NotificationType.INTERVIEW_SCHEDULED,
        title="Interview Scheduled",
        message=f"Interview scheduled with {candidate.name or 'Candidate'} on {data.date} at {data.time}",
        user_id=current_user.id,
        link=f"/interviews/{interview.id}",
    )
    act_svc = ActivityLogService(db)
    await act_svc.log(
        action="interview_scheduled",
        entity_type="interview",
        entity_id=interview.id,
        company_id=current_user.company_id,
        user_id=current_user.id,
        details={"candidate_id": data.candidate_id, "date": data.date, "time": data.time},
    )

    resp = InterviewResponse.model_validate(interview)
    resp.candidate_name = candidate.name
    return resp


@router.patch("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str,
    data: InterviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])
    repo = _repo(db, current_user.company_id)
    update_data = data.model_dump(exclude_unset=True)

    if data.date or data.time:
        interview = await repo.get_interview(interview_id)
        if interview and interview.meeting_link:
            cal = _calendar(db, current_user.company_id)
            new_meet = await cal.create_meet_link(
                summary=f"Interview (rescheduled)",
                date=data.date or interview.date,
                time=data.time or interview.time,
                timezone=data.timezone or interview.timezone,
            )
            if new_meet:
                update_data["meeting_link"] = new_meet

    if data.status == "cancelled":
        update_data["status"] = InterviewStatus.CANCELLED

    interview = await repo.update_interview(interview_id, update_data)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    resp = InterviewResponse.model_validate(interview)
    cand_result = await db.execute(
        select(CandidateProfile.name).where(CandidateProfile.id == interview.candidate_id)
    )
    name = cand_result.scalar_one_or_none()
    resp.candidate_name = name
    return resp


@router.post("/{interview_id}/cancel", response_model=InterviewResponse)
async def cancel_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, ["company_admin", "hr_recruiter"])
    repo = _repo(db, current_user.company_id)
    interview = await repo.cancel_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    resp = InterviewResponse.model_validate(interview)
    cand_result = await db.execute(
        select(CandidateProfile.name).where(CandidateProfile.id == interview.candidate_id)
    )
    name = cand_result.scalar_one_or_none()
    resp.candidate_name = name
    return resp


@router.get("/{interview_id}/ics")
async def download_ics(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi.responses import PlainTextResponse

    repo = _repo(db, current_user.company_id)
    interview = await repo.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    cand_result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == interview.candidate_id)
    )
    candidate = cand_result.scalar_one_or_none()

    ics = ICSService.generate(
        summary=f"Interview with {candidate.name if candidate else 'Candidate'}",
        description=f"Interview for {candidate.name if candidate else 'Candidate'} - {interview.notes or ''}",
        date=interview.date, time=interview.time, timezone_str=interview.timezone,
        attendee=candidate.email if candidate else "",
    )
    return PlainTextResponse(
        content=ics,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=interview_{interview_id}.ics"},
    )
