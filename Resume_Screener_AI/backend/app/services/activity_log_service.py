import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import ActivityLog

logger = logging.getLogger(__name__)


class ActivityLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(self, action: str, entity_type: str, entity_id: Optional[str] = None,
                  company_id: Optional[str] = None, user_id: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None) -> ActivityLog:
        entry = ActivityLog(
            company_id=company_id or "",
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        logger.info("Activity: %s %s %s", action, entity_type, entity_id or "")
        return entry

    async def list(self, company_id: Optional[str] = None,
                   entity_type: Optional[str] = None,
                   action: Optional[str] = None,
                   limit: int = 50, offset: int = 0) -> list:
        from sqlalchemy import select
        query = select(ActivityLog)
        if company_id:
            query = query.where(ActivityLog.company_id == company_id)
        if entity_type:
            query = query.where(ActivityLog.entity_type == entity_type)
        if action:
            query = query.where(ActivityLog.action == action)
        query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
