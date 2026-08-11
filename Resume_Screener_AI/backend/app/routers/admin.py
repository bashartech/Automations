from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.models.orm import User, UserRole
from app.dependencies import get_current_user, require_role
from app.services.logging_service import FailedTaskService, TaskLogService

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/failed-tasks")
async def list_failed_tasks(
    resolved: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)),
):
    svc = FailedTaskService(db)
    tasks = await svc.list(resolved=resolved, limit=limit, offset=offset)
    total = await svc.count(resolved=resolved)
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "tasks": [
            {
                "id": t.id,
                "task_name": t.task_name,
                "task_id": t.task_id,
                "correlation_id": t.correlation_id,
                "entity_id": t.entity_id,
                "error_message": t.error_message,
                "retry_count": t.retry_count,
                "resolved": t.resolved,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks
        ],
    }


@router.post("/failed-tasks/{task_id}/resolve")
async def resolve_failed_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)),
):
    svc = FailedTaskService(db)
    ok = await svc.mark_resolved(task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Failed task not found")
    return {"message": "Task marked as resolved"}


@router.get("/task-logs")
async def list_task_logs(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)),
):
    svc = TaskLogService(db)
    logs = await svc.list(limit=limit, offset=offset)
    return {
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": l.id,
                "task_name": l.task_name,
                "correlation_id": l.correlation_id,
                "entity_id": l.entity_id,
                "status": l.status,
                "message": l.message,
                "duration_ms": l.duration_ms,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }
