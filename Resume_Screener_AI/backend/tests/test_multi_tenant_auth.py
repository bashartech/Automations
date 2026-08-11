import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.orm import User, Company, Department, UserRole
from app.auth_utils import hash_password, create_token


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.fixture
def sample_user():
    return User(
        id="user-1",
        email="admin@test.com",
        password_hash=hash_password("pass123"),
        name="Admin User",
        credits_remaining=20,
        role=UserRole.COMPANY_ADMIN,
        company_id="company-1",
        created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_user_no_company():
    return User(
        id="user-2",
        email="new@test.com",
        password_hash=hash_password("pass123"),
        name="New User",
        credits_remaining=20,
        role=UserRole.COMPANY_ADMIN,
        company_id=None,
        created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_company():
    return Company(
        id="company-1",
        name="Test Corp",
        industry="Tech",
        company_size="50-200",
        website="https://testcorp.com",
        country="US",
        city="San Francisco",
        timezone="PST",
        default_language="en",
        hr_email="hr@testcorp.com",
        contact_number="+1-555-0000",
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_department():
    return Department(
        id="dept-1",
        company_id="company-1",
        name="Engineering",
        created_at=datetime(2025, 1, 1),
    )


# ── Test 1: User registration sets role=COMPANY_ADMIN ───

@patch("app.routers.auth.get_user_by_email", new_callable=AsyncMock)
@patch("app.routers.auth.hash_password")
@patch("app.routers.auth.create_token")
def test_register_sets_role_company_admin(mock_create_token, mock_hash, mock_get_user, mock_db):
    from app.routers.auth import register
    from app.models.candidate_schemas import RegisterRequest

    mock_get_user.return_value = None
    mock_hash.return_value = "$2b$12$hashedpassword"
    mock_create_token.return_value = "token-123"

    mock_req = MagicMock()
    mock_req.client.host = "127.0.0.1"
    mock_req.method = "POST"
    mock_req.url.path = "/api/auth/register"

    request = RegisterRequest(email="new@test.com", password="pass1234", name="New User")

    import asyncio
    result = asyncio.run(register(request, mock_req, mock_db))

    # Verify user was added with COMPANY_ADMIN role (first db.add call)
    added_user = mock_db.add.call_args_list[0][0][0]
    assert added_user.role == UserRole.COMPANY_ADMIN
    assert added_user.email == "new@test.com"
    assert result.token == "token-123"


# ── Test 2: Login response includes role and company_id ──

@patch("app.routers.auth.get_user_by_email", new_callable=AsyncMock)
@patch("app.routers.auth.verify_password")
@patch("app.routers.auth.create_token")
def test_login_response_includes_role_and_company(mock_create_token, mock_verify, mock_get_user, mock_db, sample_user):
    from app.routers.auth import login
    from app.models.candidate_schemas import LoginRequest

    mock_get_user.return_value = sample_user
    mock_verify.return_value = True
    mock_create_token.return_value = "token-123"

    mock_req = MagicMock()
    mock_req.client.host = "127.0.0.1"

    request = LoginRequest(email="admin@test.com", password="pass123")

    import asyncio
    result = asyncio.run(login(request, mock_req, mock_db))

    assert result.user["role"] == "company_admin"
    assert result.user["company_id"] == "company-1"
    assert result.token == "token-123"


# ── Test 3: /me endpoint returns role and company_id ──

def test_me_response_includes_role_and_company(sample_user):
    from app.routers.auth import get_me

    import asyncio
    result = asyncio.run(get_me(sample_user))

    assert result.role == "company_admin"
    assert result.company_id == "company-1"
    assert result.email == "admin@test.com"


# ── Test 4: Register company creates company and assigns to user ──

@patch("app.routers.auth.Company")
def test_register_company_creates_and_assigns(mock_company_model, mock_db, sample_user_no_company):
    from app.routers.auth import register_company
    from app.models.candidate_schemas import CompanyCreate

    mock_company = MagicMock(spec=Company)
    mock_company.id = "new-company-1"
    mock_company.name = "New Corp"
    mock_company.industry = "Finance"
    mock_company.country = "US"
    mock_company.city = "NYC"
    mock_company.timezone = "EST"
    mock_company.default_language = "en"
    mock_company.hr_email = "hr@newcorp.com"
    mock_company.contact_number = None
    mock_company.company_size = None
    mock_company.website = None
    mock_company.logo_url = None
    mock_company.created_at = datetime(2025, 1, 1)
    mock_company.updated_at = datetime(2025, 1, 1)
    mock_company_model.return_value = mock_company

    mock_db.refresh = AsyncMock()

    request = CompanyCreate(name="New Corp", industry="Finance", country="US", city="NYC", timezone="EST")

    import asyncio
    result = asyncio.run(register_company(request, sample_user_no_company, mock_db))

    assert result.name == "New Corp"
    assert sample_user_no_company.company_id == "new-company-1"
    mock_db.add.assert_called_once()


# ── Test 5: RBAC require_role allows correct role ──

@pytest.mark.asyncio
async def test_require_role_allows_correct_role():
    from app.dependencies import require_role

    user = User(id="u1", role=UserRole.COMPANY_ADMIN, email="a@b.com")
    dep = require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)

    result = await dep(current_user=user)
    assert result == user


# ── Test 6: RBAC require_role denies wrong role ──

@pytest.mark.asyncio
async def test_require_role_denies_wrong_role():
    from app.dependencies import require_role
    from fastapi import HTTPException

    user = User(id="u1", role=UserRole.HR_RECRUITER, email="a@b.com")
    dep = require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)

    with pytest.raises(HTTPException) as exc:
        await dep(current_user=user)
    assert exc.value.status_code == 403


# ── Test 7: require_company_access passes with company ──

@pytest.mark.asyncio
async def test_require_company_access_passes():
    from app.dependencies import require_company_access

    user = User(id="u1", role=UserRole.COMPANY_ADMIN, company_id="c1", email="a@b.com")
    result = await require_company_access(current_user=user)
    assert result == user


# ── Test 8: require_company_access fails without company ──

@pytest.mark.asyncio
async def test_require_company_access_fails():
    from app.dependencies import require_company_access
    from fastapi import HTTPException

    user = User(id="u1", role=UserRole.COMPANY_ADMIN, company_id=None, email="a@b.com")

    with pytest.raises(HTTPException) as exc:
        await require_company_access(current_user=user)
    assert exc.value.status_code == 403


# ── Test 9: verify_company_ownership allows same company ──

@pytest.mark.asyncio
async def test_verify_company_ownership_allows_same_company():
    from app.dependencies import verify_company_ownership

    user = User(id="u1", role=UserRole.COMPANY_ADMIN, company_id="c1", email="a@b.com")
    result = await verify_company_ownership("c1", current_user=user)
    assert result == user


# ── Test 10: verify_company_ownership denies different company ──

@pytest.mark.asyncio
async def test_verify_company_ownership_denies_different():
    from app.dependencies import verify_company_ownership
    from fastapi import HTTPException

    user = User(id="u1", role=UserRole.COMPANY_ADMIN, company_id="c1", email="a@b.com")

    with pytest.raises(HTTPException) as exc:
        await verify_company_ownership("c2", current_user=user)
    assert exc.value.status_code == 403


# ── Test 11: SUPER_ADMIN bypasses company ownership check ──

@pytest.mark.asyncio
async def test_super_admin_bypasses_company_check():
    from app.dependencies import verify_company_ownership

    user = User(id="u1", role=UserRole.SUPER_ADMIN, company_id=None, email="a@b.com")
    result = await verify_company_ownership("c2", current_user=user)
    assert result == user


# ── Test 12: Company create sets all 13 fields ──

def test_company_creation_all_fields():
    from app.models.candidate_schemas import CompanyCreate

    data = CompanyCreate(
        name="Full Corp",
        industry="Healthcare",
        company_size="1000+",
        website="https://fullcorp.com",
        country="CA",
        city="Toronto",
        timezone="EST",
        default_language="fr",
        hr_email="hr@fullcorp.com",
        contact_number="+1-416-555-0000",
    )

    assert data.name == "Full Corp"
    assert data.industry == "Healthcare"
    assert data.company_size == "1000+"
    assert data.website == "https://fullcorp.com"
    assert data.country == "CA"
    assert data.city == "Toronto"
    assert data.timezone == "EST"
    assert data.default_language == "fr"
    assert data.hr_email == "hr@fullcorp.com"
    assert data.contact_number == "+1-416-555-0000"


# ── Test 13: Company model_validate round-trip ──

def test_company_response_from_orm(sample_company):
    resp = CompanyResponse.model_validate(sample_company)
    assert resp.id == "company-1"
    assert resp.name == "Test Corp"
    assert resp.industry == "Tech"
    assert resp.website == "https://testcorp.com"


# ── Test 14: Department response from ORM ──

def test_department_response_from_orm(sample_department):
    resp = DepartmentResponse.model_validate(sample_department)
    assert resp.id == "dept-1"
    assert resp.company_id == "company-1"
    assert resp.name == "Engineering"


from app.models.candidate_schemas import CompanyResponse, DepartmentResponse


# ── Test 15: Two users create separate companies (tenant isolation base test) ──

@patch("app.routers.auth.Company")
def test_two_users_create_separate_companies(mock_company_model, mock_db):
    from app.routers.auth import register_company
    from app.models.candidate_schemas import CompanyCreate
    from datetime import datetime

    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    def make_mock_company(cid, cname):
        mc = MagicMock(spec=Company)
        mc.id = cid
        mc.name = cname
        mc.industry = None
        mc.company_size = None
        mc.website = None
        mc.country = None
        mc.city = None
        mc.timezone = "UTC"
        mc.default_language = "en"
        mc.hr_email = None
        mc.contact_number = None
        mc.logo_url = None
        mc.created_at = datetime(2025, 1, 1)
        mc.updated_at = datetime(2025, 1, 1)
        return mc

    user_a = User(id="u-a", role=UserRole.COMPANY_ADMIN, company_id=None, email="a@corp.com", created_at=datetime(2025, 1, 1))
    mock_a = make_mock_company("comp-a", "Company A")
    mock_company_model.return_value = mock_a

    request = CompanyCreate(name="Company A")
    import asyncio
    asyncio.run(register_company(request, user_a, mock_db))
    assert user_a.company_id == "comp-a"

    user_b = User(id="u-b", role=UserRole.COMPANY_ADMIN, company_id=None, email="b@corp.com", created_at=datetime(2025, 1, 1))
    mock_b = make_mock_company("comp-b", "Company B")
    mock_company_model.return_value = mock_b

    request2 = CompanyCreate(name="Company B")
    asyncio.run(register_company(request2, user_b, mock_db))
    assert user_b.company_id == "comp-b"

    assert user_a.company_id != user_b.company_id
