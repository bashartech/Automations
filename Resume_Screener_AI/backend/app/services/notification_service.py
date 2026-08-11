import logging
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import Notification, NotificationType

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession, company_id: Optional[str] = None):
        self.db = db
        self.company_id = company_id

    async def create(self, type: NotificationType, title: str, message: str,
                     user_id: Optional[str] = None, link: Optional[str] = None) -> Notification:
        notif = Notification(
            company_id=self.company_id or "",
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            link=link,
        )
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        logger.info("Notification created: %s — %s", type.value, title)
        return notif

    async def list(self, limit: int = 50, offset: int = 0,
                   unread_only: bool = False) -> List[Notification]:
        query = select(Notification)
        if self.company_id:
            query = query.where(Notification.company_id == self.company_id)
        if unread_only:
            query = query.where(Notification.read == False)
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def mark_read(self, notification_id: str) -> bool:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.id == notification_id)
            .values(read=True)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def mark_all_read(self) -> int:
        query = update(Notification).values(read=True)
        if self.company_id:
            query = query.where(Notification.company_id == self.company_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount

    async def unread_count(self) -> int:
        query = select(Notification).where(Notification.read == False)
        if self.company_id:
            query = query.where(Notification.company_id == self.company_id)
        result = await self.db.execute(query)
        return len(list(result.scalars().all()))
