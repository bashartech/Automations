import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.orm import User
from app.models.candidate_schemas import NotificationResponse, ActivityLogResponse
from app.dependencies import get_current_user
from app.services.notification_service import NotificationService
from app.services.activity_log_service import ActivityLogService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db, current_user.company_id)
    notifs = await svc.list(limit=limit, offset=offset, unread_only=unread_only)
    return [NotificationResponse.model_validate(n) for n in notifs]


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db, current_user.company_id)
    count = await svc.unread_count()
    return {"unread_count": count}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db, current_user.company_id)
    ok = await svc.mark_read(notification_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db, current_user.company_id)
    count = await svc.mark_all_read()
    return {"marked_read": count}


# ── Activity Logs ──

@router.get("/activity-logs", response_model=List[ActivityLogResponse])
async def list_activity_logs(
    entity_type: str = Query(None),
    action: str = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = ActivityLogService(db)
    logs = await svc.list(
        company_id=current_user.company_id,
        entity_type=entity_type,
        action=action,
        limit=limit, offset=offset,
    )
    return [ActivityLogResponse.model_validate(l) for l in logs]
