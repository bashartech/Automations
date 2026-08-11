import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.orm import Notification, NotificationType, ActivityLog


class TestNotificationService:
    @pytest.mark.asyncio
    async def test_create_notification(self):
        from app.services.notification_service import NotificationService

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        svc = NotificationService(mock_db, "c1")
        notif = await svc.create(
            type=NotificationType.PROCESSING_COMPLETE,
            title="Processing Done",
            message="All 10 resumes processed",
            user_id="u1",
            link="/batches/b1",
        )
        assert notif.title == "Processing Done"
        assert notif.company_id == "c1"
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_notifications(self):
        from app.services.notification_service import NotificationService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            Notification(id="n1", company_id="c1", type=NotificationType.PROCESSING_COMPLETE,
                         title="Done", message="ok", read=False, created_at=datetime(2025, 1, 1)),
        ]
        mock_db.execute.return_value = mock_result

        svc = NotificationService(mock_db, "c1")
        notifs = await svc.list()
        assert len(notifs) == 1
        assert notifs[0].title == "Done"

    @pytest.mark.asyncio
    async def test_mark_read(self):
        from app.services.notification_service import NotificationService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 1
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()

        svc = NotificationService(mock_db, "c1")
        ok = await svc.mark_read("n1")
        assert ok is True

    @pytest.mark.asyncio
    async def test_mark_all_read(self):
        from app.services.notification_service import NotificationService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 3
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()

        svc = NotificationService(mock_db, "c1")
        count = await svc.mark_all_read()
        assert count == 3

    @pytest.mark.asyncio
    async def test_unread_count(self):
        from app.services.notification_service import NotificationService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [1, 2]
        mock_db.execute.return_value = mock_result

        svc = NotificationService(mock_db, "c1")
        count = await svc.unread_count()
        assert count == 2


class TestActivityLogService:
    @pytest.mark.asyncio
    async def test_log_activity(self):
        from app.services.activity_log_service import ActivityLogService

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        svc = ActivityLogService(mock_db)
        entry = await svc.log(
            action="batch_completed",
            entity_type="processing_job",
            entity_id="b1",
            company_id="c1",
            user_id="u1",
            details={"total": 10, "processed": 8, "failed": 2},
        )
        assert entry.action == "batch_completed"
        assert entry.entity_id == "b1"
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_activities(self):
        from app.services.activity_log_service import ActivityLogService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            ActivityLog(id="a1", company_id="c1", action="batch_completed",
                        entity_type="processing_job", entity_id="b1",
                        created_at=datetime(2025, 1, 1)),
        ]
        mock_db.execute.return_value = mock_result

        svc = ActivityLogService(mock_db)
        logs = await svc.list(company_id="c1")
        assert len(logs) == 1
        assert logs[0].action == "batch_completed"


class TestNotificationSchemas:
    def test_notification_response_from_orm(self):
        from app.models.candidate_schemas import NotificationResponse

        notif = Notification(
            id="n1", company_id="c1", user_id="u1",
            type=NotificationType.PROCESSING_COMPLETE,
            title="Done", message="All processed",
            read=False, created_at=datetime(2025, 1, 1),
        )
        resp = NotificationResponse.model_validate(notif)
        assert resp.id == "n1"
        assert resp.type == "processing_complete"
        assert resp.read is False

    def test_activity_log_response_from_orm(self):
        from app.models.candidate_schemas import ActivityLogResponse

        log = ActivityLog(
            id="a1", company_id="c1", user_id="u1",
            action="batch_completed", entity_type="processing_job",
            entity_id="b1", details={"total": 10},
            created_at=datetime(2025, 1, 1),
        )
        resp = ActivityLogResponse.model_validate(log)
        assert resp.id == "a1"
        assert resp.action == "batch_completed"
        assert resp.details == {"total": 10}


class TestNotificationTypeEnum:
    def test_enum_values(self):
        assert NotificationType.PROCESSING_COMPLETE.value == "processing_complete"
        assert NotificationType.INTERVIEW_SCHEDULED.value == "interview_scheduled"
        assert NotificationType.CANDIDATE_STATUS_UPDATED.value == "candidate_status_updated"
        assert NotificationType.SYSTEM_ERROR.value == "system_error"
