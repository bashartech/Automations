import uuid
import logging
import traceback
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.orm import FailedTask, TaskLog


def generate_correlation_id() -> str:
    return str(uuid.uuid4())


class CorrelationLogger:
    def __init__(self, correlation_id: Optional[str] = None):
        self.correlation_id = correlation_id or generate_correlation_id()
        self._logger = logging.getLogger("resume_screener")

    def info(self, message: str, *args, **extra):
        if args:
            self._logger.info("[%s] " + message, self.correlation_id, *args, extra=extra)
        else:
            self._logger.info("[%s] %s", self.correlation_id, message, extra=extra)

    def warning(self, message: str, *args, **extra):
        if args:
            self._logger.warning("[%s] " + message, self.correlation_id, *args, extra=extra)
        else:
            self._logger.warning("[%s] %s", self.correlation_id, message, extra=extra)

    def error(self, message: str, *args, **extra):
        if args:
            self._logger.error("[%s] " + message, self.correlation_id, *args, extra=extra)
        else:
            self._logger.error("[%s] %s", self.correlation_id, message, extra=extra)


class FailedTaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(self, task_name: str, error_message: str, correlation_id: Optional[str] = None,
                     task_id: Optional[str] = None, entity_id: Optional[str] = None,
                     traceback_str: Optional[str] = None) -> FailedTask:
        ft = FailedTask(
            task_name=task_name,
            task_id=task_id,
            correlation_id=correlation_id,
            entity_id=entity_id,
            error_message=error_message[:2000],
            traceback=traceback_str,
        )
        self.db.add(ft)
        await self.db.commit()
        await self.db.refresh(ft)
        return ft

    async def list(self, resolved: Optional[bool] = None, limit: int = 50, offset: int = 0) -> list[FailedTask]:
        query = select(FailedTask).order_by(FailedTask.created_at.desc()).offset(offset).limit(limit)
        if resolved is not None:
            query = query.where(FailedTask.resolved == resolved)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, resolved: Optional[bool] = None) -> int:
        from sqlalchemy import func
        query = select(func.count(FailedTask.id))
        if resolved is not None:
            query = query.where(FailedTask.resolved == resolved)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_resolved(self, task_id: str) -> bool:
        result = await self.db.execute(
            select(FailedTask).where(FailedTask.id == task_id)
        )
        ft = result.scalar_one_or_none()
        if not ft:
            return False
        ft.resolved = True
        await self.db.commit()
        return True


class TaskLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(self, task_name: str, status: str, correlation_id: Optional[str] = None,
                  entity_id: Optional[str] = None, message: Optional[str] = None,
                  duration_ms: Optional[int] = None) -> TaskLog:
        tl = TaskLog(
            task_name=task_name,
            correlation_id=correlation_id,
            entity_id=entity_id,
            status=status,
            message=message,
            duration_ms=duration_ms,
        )
        self.db.add(tl)
        await self.db.commit()
        await self.db.refresh(tl)
        return tl

    async def list(self, limit: int = 50, offset: int = 0) -> list[TaskLog]:
        result = await self.db.execute(
            select(TaskLog).order_by(TaskLog.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all())
