import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.orm import FailedTask, TaskLog


class TestCorrelationLogger:
    def test_generates_correlation_id(self):
        from app.services.logging_service import CorrelationLogger, generate_correlation_id
        cid = generate_correlation_id()
        assert isinstance(cid, str)
        assert len(cid) == 36

    def test_uses_provided_id(self):
        from app.services.logging_service import CorrelationLogger
        cl = CorrelationLogger("my-id-123")
        assert cl.correlation_id == "my-id-123"


class TestFailedTaskService:
    @pytest.mark.asyncio
    async def test_record_failed_task(self):
        from app.services.logging_service import FailedTaskService

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        svc = FailedTaskService(mock_db)
        ft = await svc.record(
            task_name="test_task",
            error_message="Something broke",
            correlation_id="cid-1",
            task_id="tid-1",
            entity_id="eid-1",
        )
        assert ft.task_name == "test_task"
        assert ft.error_message == "Something broke"
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_unresolved(self):
        from app.services.logging_service import FailedTaskService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            FailedTask(id="f1", task_name="t1", error_message="err1", resolved=False),
        ]
        mock_db.execute.return_value = mock_result

        svc = FailedTaskService(mock_db)
        tasks = await svc.list(resolved=False)
        assert len(tasks) == 1
        assert tasks[0].resolved is False

    @pytest.mark.asyncio
    async def test_mark_resolved(self):
        from app.services.logging_service import FailedTaskService

        mock_db = AsyncMock()
        mock_ft = MagicMock(spec=FailedTask)
        mock_ft.resolved = False
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_ft
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()

        svc = FailedTaskService(mock_db)
        ok = await svc.mark_resolved("f1")
        assert ok is True
        assert mock_ft.resolved is True

    @pytest.mark.asyncio
    async def test_mark_resolved_not_found(self):
        from app.services.logging_service import FailedTaskService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        svc = FailedTaskService(mock_db)
        ok = await svc.mark_resolved("nonexistent")
        assert ok is False


class TestTaskLogService:
    @pytest.mark.asyncio
    async def test_log_task(self):
        from app.services.logging_service import TaskLogService

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        svc = TaskLogService(mock_db)
        tl = await svc.log(
            task_name="process_resume",
            status="success",
            correlation_id="cid-1",
            entity_id="eid-1",
            duration_ms=1500,
        )
        assert tl.task_name == "process_resume"
        assert tl.status == "success"
        assert tl.duration_ms == 1500
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_task_logs(self):
        from app.services.logging_service import TaskLogService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            TaskLog(id="l1", task_name="t1", status="success"),
        ]
        mock_db.execute.return_value = mock_result

        svc = TaskLogService(mock_db)
        logs = await svc.list()
        assert len(logs) == 1
        assert logs[0].task_name == "t1"


class TestCircuitBreaker:
    @pytest.mark.asyncio
    async def test_graceful_degradation_returns_fallback(self):
        from app.services.circuit_breaker import graceful_degradation

        @graceful_degradation(fallback_result={"score": 0})
        async def failing_func():
            raise ValueError("AI service down")

        result = await failing_func()
        assert result == {"score": 0}

    @pytest.mark.asyncio
    async def test_graceful_degradation_passes_success(self):
        from app.services.circuit_breaker import graceful_degradation

        @graceful_degradation(fallback_result=None)
        async def working_func():
            return {"score": 85}

        result = await working_func()
        assert result == {"score": 85}

    @pytest.mark.asyncio
    async def test_fallback_chain(self):
        from app.services.circuit_breaker import fallback_chain

        async def provider1():
            raise ValueError("provider1 down")

        async def provider2():
            return {"result": "from provider2"}

        result = await fallback_chain([provider1, provider2], name="test")
        assert result == {"result": "from provider2"}

    @pytest.mark.asyncio
    async def test_fallback_chain_all_fail(self):
        from app.services.circuit_breaker import fallback_chain, ServiceUnavailableError

        async def p1():
            raise ValueError("p1 down")

        async def p2():
            raise RuntimeError("p2 down")

        with pytest.raises(ServiceUnavailableError):
            await fallback_chain([p1, p2], name="test")


class TestFailedTaskModel:
    def test_failed_task_attributes(self):
        ft = FailedTask(
            task_name="test", error_message="err",
            resolved=True, retry_count=3,
        )
        assert ft.resolved is True
        assert ft.retry_count == 3

    def test_task_log_orm(self):
        tl = TaskLog(task_name="test", status="success")
        assert tl.status == "success"
