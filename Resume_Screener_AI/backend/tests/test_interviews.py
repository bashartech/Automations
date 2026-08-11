import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.orm import Interview, InterviewSlot, InterviewStatus, CandidateProfile, User, UserRole


@pytest.fixture
def hr_user():
    return User(
        id="u1", role=UserRole.HR_RECRUITER, company_id="c1",
        email="hr@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def company_admin():
    return User(
        id="u2", role=UserRole.COMPANY_ADMIN, company_id="c1",
        email="admin@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_slot():
    return InterviewSlot(
        id="s1", company_id="c1", day_of_week=1,
        start_time="09:00", end_time="10:00", is_available=True,
        created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_interview():
    return Interview(
        id="i1", company_id="c1", job_id="j1", candidate_id="c1",
        date="2025-02-01", time="10:00", timezone="UTC",
        meeting_link="https://meet.google.com/abc-defg-hij",
        interviewer="John", interview_round=1,
        status=InterviewStatus.SCHEDULED,
        notes="Technical round",
        created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1),
    )


# ── ICS Service Tests ──

class TestICSService:
    def test_ics_generates_valid_content(self):
        from app.services.ics_service import ICSService

        ics = ICSService.generate(
            summary="Interview with Alice",
            description="Technical interview for backend role",
            date="2025-02-01", time="10:00", timezone_str="UTC",
            attendee="alice@example.com",
        )
        assert "BEGIN:VCALENDAR" in ics
        assert "END:VCALENDAR" in ics
        assert "BEGIN:VEVENT" in ics
        assert "END:VEVENT" in ics
        assert "SUMMARY:Interview with Alice" in ics
        assert "ATTENDEE" in ics
        assert "alice@example.com" in ics
        assert "BEGIN:VALARM" in ics
        assert "TRIGGER:-PT24H" in ics
        assert "TRIGGER:-PT1H" in ics

    def test_ics_generated_without_attendee(self):
        from app.services.ics_service import ICSService

        ics = ICSService.generate(
            summary="Test", description="Test",
            date="2025-02-01", time="10:00", timezone_str="UTC",
        )
        assert "ATTENDEE" not in ics
        assert "ORGANIZER" in ics


# ── Calendar Service Tests ──

class TestCalendarService:
    @pytest.mark.asyncio
    async def test_mock_meet_link_generated(self):
        from app.services.calendar_service import CalendarService

        svc = CalendarService()
        svc.mock = True
        link = await svc.create_meet_link("Test", "2025-02-01", "10:00", "UTC")
        assert link is not None
        assert link.startswith("https://meet.google.com/")
        assert len(link) > len("https://meet.google.com/")

    @pytest.mark.asyncio
    async def test_real_mode_returns_none_without_credentials(self):
        from app.services.calendar_service import CalendarService

        svc = CalendarService()
        svc.mock = False
        svc.credentials = ""
        link = await svc.create_meet_link("Test", "2025-02-01", "10:00", "UTC")
        assert link is None


# ── Email Service Tests ──

class TestEmailService:
    @pytest.mark.asyncio
    async def test_mock_email_logs_and_returns_true(self):
        from app.services.email_service import EmailService

        svc = EmailService()
        svc.mock = True
        result = await svc.send_interview_email(
            to_email="candidate@test.com", candidate_name="Alice",
            date="2025-02-01", time="10:00", timezone="UTC",
            meet_link="https://meet.google.com/test",
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_real_mode_returns_false_without_credentials(self):
        from app.services.email_service import EmailService

        svc = EmailService()
        svc.mock = False
        svc.service_id = ""
        result = await svc.send_interview_email(
            to_email="candidate@test.com", candidate_name="Alice",
            date="2025-02-01", time="10:00", timezone="UTC",
            meet_link="https://meet.google.com/test",
        )
        assert result is False


# ── Interview Slot CRUD Tests ──

class TestSlotRepository:
    @pytest.fixture
    def repo(self):
        from app.repositories.interview_repository import InterviewRepository
        return InterviewRepository.__new__(InterviewRepository)

    def test_create_slot(self):
        from app.repositories.interview_repository import InterviewRepository

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        repo = InterviewRepository(mock_db, "c1")
        slot = InterviewSlot(day_of_week=1, start_time="09:00", end_time="10:00")
        import asyncio
        result = asyncio.run(repo.create_slot(slot))
        assert result is not None

    def test_list_slots(self):
        from app.repositories.interview_repository import InterviewRepository

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        repo = InterviewRepository(mock_db, "c1")
        import asyncio
        slots = asyncio.run(repo.list_slots())
        assert len(slots) == 0


# ── Interview CRUD Tests ──

@pytest.mark.asyncio
async def test_schedule_interview_creates_meet_link(hr_user):
    from app.services.calendar_service import CalendarService
    from app.services.email_service import EmailService

    svc = CalendarService()
    svc.mock = True
    link = await svc.create_meet_link("Test Interview", "2025-02-01", "10:00", "UTC")
    assert link is not None
    assert link.startswith("https://meet.google.com/")


@pytest.mark.asyncio
async def test_interview_status_enum():
    assert InterviewStatus.SCHEDULED.value == "scheduled"
    assert InterviewStatus.COMPLETED.value == "completed"
    assert InterviewStatus.CANCELLED.value == "cancelled"


class TestInterviewRepository:
    @pytest.mark.asyncio
    async def test_create_interview(self):
        from app.repositories.interview_repository import InterviewRepository

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        repo = InterviewRepository(mock_db, "c1")
        interview = Interview(
            candidate_id="c1", date="2025-02-01", time="10:00", timezone="UTC",
        )
        await repo.create_interview(interview)
        assert interview.company_id == "c1"
        mock_db.add.assert_called_once_with(interview)

    @pytest.mark.asyncio
    async def test_cancel_interview(self):
        from app.repositories.interview_repository import InterviewRepository

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = Interview(
            id="i1", company_id="c1", candidate_id="c1",
            date="2025-02-01", time="10:00", timezone="UTC",
            status=InterviewStatus.SCHEDULED,
        )
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        repo = InterviewRepository(mock_db, "c1")
        result = await repo.cancel_interview("i1")
        assert result is not None
        assert result.status == InterviewStatus.CANCELLED


# ── Interview Schema Tests ──

class TestInterviewSchemas:
    def test_interview_slot_create_valid(self):
        from app.models.candidate_schemas import InterviewSlotCreate

        slot = InterviewSlotCreate(day_of_week=1, start_time="09:00", end_time="10:00")
        assert slot.day_of_week == 1
        assert slot.start_time == "09:00"
        assert slot.is_available is True

    def test_interview_create_valid(self):
        from app.models.candidate_schemas import InterviewCreate

        data = InterviewCreate(
            candidate_id="c1", date="2025-02-01", time="10:00",
            timezone="UTC", interviewer="John", notes="Technical",
        )
        assert data.candidate_id == "c1"
        assert data.interview_round == 1

    def test_interview_response_from_orm(self, sample_interview):
        from app.models.candidate_schemas import InterviewResponse

        resp = InterviewResponse.model_validate(sample_interview)
        assert resp.id == "i1"
        assert resp.status == InterviewStatus.SCHEDULED.value
        assert resp.meeting_link == "https://meet.google.com/abc-defg-hij"

    def test_interview_slot_response_from_orm(self, sample_slot):
        from app.models.candidate_schemas import InterviewSlotResponse

        resp = InterviewSlotResponse.model_validate(sample_slot)
        assert resp.id == "s1"
        assert resp.day_of_week == 1
        assert resp.is_available is True
