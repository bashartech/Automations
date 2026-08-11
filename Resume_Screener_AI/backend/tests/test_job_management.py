import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.orm import Job, User, UserRole, JobStatus
from app.models.candidate_schemas import JobCreate, JobUpdate, JobResponse, JDReviewResponse


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()
    db.delete = AsyncMock()
    return db


@pytest.fixture
def company_admin():
    return User(
        id="u1", role=UserRole.COMPANY_ADMIN, company_id="c1",
        email="admin@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def hr_user():
    return User(
        id="u2", role=UserRole.HR_RECRUITER, company_id="c1",
        email="hr@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def other_company_user():
    return User(
        id="u3", role=UserRole.COMPANY_ADMIN, company_id="c2",
        email="admin@other.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_job():
    return Job(
        id="j1", company_id="c1", title="Backend Engineer",
        employment_type="full-time", location="Remote",
        remote_type="remote", experience_required="5+ years",
        salary_min=100000.0, salary_max=150000.0, currency="USD",
        num_openings=2, required_skills=["Python", "FastAPI", "PostgreSQL"],
        preferred_skills=["Redis", "Docker"], status=JobStatus.DRAFT,
        created_by="u1", description="We need a senior backend engineer...",
        created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1),
    )


# ── Test 1: JD Agent suggests improvements ──

@pytest.mark.asyncio
@patch("app.services.jd_agent.AsyncAIClient")
async def test_jd_agent_suggests_improvements(mock_ai_client):
    from app.services.jd_agent import JDAgent

    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value='''
    {
        "suggestions": ["Add a clear salary range", "Include team size"],
        "missing_skills": ["Docker", "CI/CD"],
        "grammar_issues": ["Use consistent tense"],
        "inclusive_language_suggestions": ["Replace 'him/her' with 'the candidate'"],
        "recommendation": "revision",
        "overall_quality_score": 65.0
    }
    ''')
    mock_ai_client.return_value = mock_client

    agent = JDAgent()
    result = await agent.review("Backend Engineer", "We need a backend engineer...", ["Python"])

    assert len(result["suggestions"]) == 2
    assert "Docker" in result["missing_skills"]
    assert result["recommendation"] == "revision"
    assert result["overall_quality_score"] == 65.0


# ── Test 2: JD Agent recommends approve for strong JD ──

@pytest.mark.asyncio
@patch("app.services.jd_agent.AsyncAIClient")
async def test_jd_agent_recommends_approve(mock_ai_client):
    from app.services.jd_agent import JDAgent

    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value='''
    {
        "suggestions": ["Consider adding a culture section"],
        "missing_skills": [],
        "grammar_issues": [],
        "inclusive_language_suggestions": [],
        "recommendation": "approve",
        "overall_quality_score": 85.0
    }
    ''')
    mock_ai_client.return_value = mock_client

    agent = JDAgent()
    result = await agent.review("Senior Dev", "Comprehensive job description...", ["Python", "AWS"])
    assert result["recommendation"] == "approve"


# ── Test 3: Create job with all fields ──

@pytest.mark.asyncio
async def test_create_job_with_all_fields(mock_db, company_admin):
    from app.routers.jobs import create_job

    now = datetime(2025, 1, 1)
    async def _refresh(instance):
        instance.id = "j1"
        instance.status = JobStatus.DRAFT
        instance.created_by = "u1"
        instance.created_at = now
        instance.updated_at = now
    mock_db.refresh = _refresh

    request = JobCreate(
        title="Senior Backend Engineer",
        employment_type="full-time",
        location="San Francisco",
        remote_type="hybrid",
        experience_required="5+ years",
        salary_min=120000.0, salary_max=180000.0, currency="USD",
        num_openings=3, required_skills=["Python", "FastAPI"],
        preferred_skills=["Redis"], description="Join our team...",
    )
    result = await create_job("c1", request, mock_db, company_admin)

    assert result.title == "Senior Backend Engineer"
    assert result.employment_type == "full-time"
    assert result.currency == "USD"
    mock_db.add.assert_called_once()


# ── Test 4: List jobs ──

@pytest.mark.asyncio
async def test_list_jobs(mock_db, company_admin, sample_job):
    from app.routers.jobs import list_jobs

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [sample_job]
    mock_db.execute.return_value = mock_result

    result = await list_jobs("c1", db=mock_db, current_user=company_admin)
    assert len(result) == 1
    assert result[0].title == "Backend Engineer"


# ── Test 5: Get job ──

@pytest.mark.asyncio
async def test_get_job(mock_db, company_admin, sample_job):
    from app.routers.jobs import get_job

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_job
    mock_db.execute.return_value = mock_result

    result = await get_job("c1", "j1", mock_db, company_admin)
    assert result.title == "Backend Engineer"
    assert result.required_skills == ["Python", "FastAPI", "PostgreSQL"]


# ── Test 6: Update job ──

@pytest.mark.asyncio
async def test_update_job(mock_db, company_admin, sample_job):
    from app.routers.jobs import update_job

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_job
    mock_db.execute.return_value = mock_result
    mock_db.refresh = AsyncMock()

    request = JobUpdate(title="Senior Backend Engineer", salary_min=130000.0)
    result = await update_job("c1", "j1", request, mock_db, company_admin)

    assert sample_job.title == "Senior Backend Engineer"
    assert sample_job.salary_min == 130000.0


# ── Test 7: Delete job ──

@pytest.mark.asyncio
async def test_delete_job(mock_db, company_admin, sample_job):
    from app.routers.jobs import delete_job

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_job
    mock_db.execute.return_value = mock_result

    result = await delete_job("c1", "j1", mock_db, company_admin)
    assert result is None
    mock_db.delete.assert_called_once_with(sample_job)
    mock_db.commit.assert_called_once()


# ── Test 8: HR user can create job ──

@pytest.mark.asyncio
async def test_hr_can_create_job(mock_db, hr_user):
    from app.routers.jobs import create_job

    now = datetime(2025, 1, 1)
    async def _refresh(instance):
        instance.id = "j2"
        instance.status = JobStatus.DRAFT
        instance.created_by = "u2"
        instance.created_at = now
        instance.updated_at = now
    mock_db.refresh = _refresh

    request = JobCreate(title="Junior Dev", description="Entry level")
    result = await create_job("c1", request, mock_db, hr_user)
    assert result.title == "Junior Dev"


# ── Test 9: Cross-company access denied for list ──

@pytest.mark.asyncio
async def test_cross_company_job_access_denied(mock_db, other_company_user):
    from app.routers.jobs import list_jobs
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await list_jobs("c1", db=mock_db, current_user=other_company_user)
    assert exc.value.status_code == 403


# ── Test 10: Cross-company access denied for create ──

@pytest.mark.asyncio
async def test_cross_company_job_create_denied(mock_db, other_company_user):
    from app.routers.jobs import create_job
    from fastapi import HTTPException
    from app.models.candidate_schemas import JobCreate

    request = JobCreate(title="Test")
    with pytest.raises(HTTPException) as exc:
        await create_job("c1", request, mock_db, other_company_user)
    assert exc.value.status_code == 403


# ── Test 11: Review job endpoint calls JD agent ──

@pytest.mark.asyncio
@patch("app.routers.jobs.JDAgent")
async def test_review_job_endpoint(mock_agent_cls, mock_db, company_admin, sample_job):
    from app.routers.jobs import review_job

    mock_agent = AsyncMock()
    mock_agent.review = AsyncMock(return_value={
        "suggestions": ["Add salary range"],
        "missing_skills": ["Docker"],
        "grammar_issues": [],
        "inclusive_language_suggestions": [],
        "recommendation": "revision",
        "overall_quality_score": 60.0,
    })
    mock_agent_cls.return_value = mock_agent

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_job
    mock_db.execute.return_value = mock_result

    result = await review_job("c1", "j1", mock_db, company_admin)
    assert result.recommendation == "revision"
    assert "Docker" in result.missing_skills


# ── Test 12: Approve job changes status to APPROVED ──

@pytest.mark.asyncio
async def test_approve_job(mock_db, company_admin, sample_job):
    from app.routers.jobs import approve_job

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_job
    mock_db.execute.return_value = mock_result
    mock_db.refresh = AsyncMock()

    result = await approve_job("c1", "j1", mock_db, company_admin)
    assert sample_job.status == JobStatus.APPROVED


# ── Test 13: HR cannot approve job ──

@pytest.mark.asyncio
async def test_approve_nonexistent_job_returns_404(mock_db, hr_user):
    from app.routers.jobs import approve_job
    from fastapi import HTTPException

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    with pytest.raises(HTTPException) as exc:
        await approve_job("c1", "j1", mock_db, hr_user)
    assert exc.value.status_code == 404


# ── Test 14: JobResponse from ORM ──

def test_job_response_from_orm(sample_job):
    resp = JobResponse.model_validate(sample_job)
    assert resp.title == "Backend Engineer"
    assert resp.required_skills == ["Python", "FastAPI", "PostgreSQL"]
    assert resp.status == JobStatus.DRAFT.value  # SAEnum .value


# ── Test 15: JDReviewResponse schema ──

def test_jd_review_response_schema():
    resp = JDReviewResponse(
        suggestions=["Add salary", "Fix grammar"],
        missing_skills=["Docker"],
        recommendation="revision",
        overall_quality_score=70.0,
    )
    assert len(resp.suggestions) == 2
    assert resp.overall_quality_score == 70.0


# ── Test 16: Create job with all 17+ fields ──

def test_job_create_all_fields():
    request = JobCreate(
        title="Full Stack Engineer",
        department_id="dept-1", employment_type="contract",
        location="NYC", remote_type="onsite", experience_required="3+",
        salary_min=80000.0, salary_max=120000.0, currency="EUR",
        num_openings=5, application_deadline=datetime(2025, 6, 1),
        required_skills=["React", "Python"],
        preferred_skills=["TypeScript", "AWS"],
        responsibilities=["Build features", "Code review"],
        qualifications=["BS CS", "3+ years"],
        benefits=["Equity", "Health"],
        description="Join our team in NYC",
    )
    assert request.title == "Full Stack Engineer"
    assert request.currency == "EUR"
    assert request.num_openings == 5


# ── Test 17: List jobs filtered by status ──

@pytest.mark.asyncio
async def test_list_jobs_filtered_by_status(mock_db, company_admin, sample_job):
    from app.routers.jobs import list_jobs

    sample_job.status = JobStatus.APPROVED
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [sample_job]
    mock_db.execute.return_value = mock_result

    result = await list_jobs("c1", status="approved", db=mock_db, current_user=company_admin)
    assert len(result) == 1
    assert sample_job.status == JobStatus.APPROVED
