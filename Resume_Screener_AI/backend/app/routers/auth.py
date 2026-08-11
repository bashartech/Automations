import uuid
import re
import time
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import update as sa_update
from datetime import datetime, timezone
from app.database import get_db
from app.models.orm import User, CandidateProfile, ProcessingJob, CreditTransaction, Company, UserRole
from app.models.candidate_schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse, CompanyCreate, CompanyResponse
from app.dependencies import get_current_user
from app.auth_utils import hash_password, verify_password, create_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Simple in-memory rate limiter: {ip: [timestamp, ...]}
_rate_limit_store: dict[str, list[float]] = {}
_RATE_LIMIT_WINDOW = 60
_RATE_LIMIT_MAX_ATTEMPTS = 5


def _check_rate_limit(ip: str):
    now = time.time()
    window_start = now - _RATE_LIMIT_WINDOW
    if ip in _rate_limit_store:
        _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if t > window_start]
    else:
        _rate_limit_store[ip] = []
    if len(_rate_limit_store[ip]) >= _RATE_LIMIT_MAX_ATTEMPTS:
        retry_after = int(_RATE_LIMIT_WINDOW - (now - _rate_limit_store[ip][0]))
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )
    _rate_limit_store[ip].append(now)


def _validate_email(email: str):
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        raise HTTPException(status_code=422, detail="Invalid email format")


def _validate_password(password: str):
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(status_code=422, detail="Password must contain at least one letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=422, detail="Password must contain at least one number")


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, req: Request, db: AsyncSession = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    _check_rate_limit(ip)

    _validate_email(request.email)
    _validate_password(request.password)

    existing = await get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        credits_remaining=20,
        role=UserRole.COMPANY_ADMIN,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    db.add(CreditTransaction(
        user_id=user.id,
        amount=20,
        reason="free_trial",
    ))
    await db.commit()

    await db.execute(
        sa_update(CandidateProfile)
        .where(CandidateProfile.user_id.is_(None))
        .values(user_id=user.id)
    )
    await db.execute(
        sa_update(ProcessingJob)
        .where(ProcessingJob.user_id.is_(None))
        .values(user_id=user.id)
    )
    await db.commit()

    token = create_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role.value if user.role else None, "company_id": user.company_id},
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    _check_rate_limit(ip)

    _validate_email(request.email)

    user = await get_user_by_email(db, request.email)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not (user.password_hash.startswith("$2") and len(user.password_hash) == 60):
        user.password_hash = hash_password(request.password)
        await db.commit()

    token = create_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role.value if user.role else None, "company_id": user.company_id},
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value if current_user.role else None,
        company_id=current_user.company_id,
        created_at=current_user.created_at,
    )


@router.post("/register-company", response_model=CompanyResponse)
async def register_company(
    request: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.company_id:
        raise HTTPException(status_code=400, detail="User already belongs to a company")

    company = Company(
        id=str(uuid.uuid4()),
        name=request.name,
        industry=request.industry,
        company_size=request.company_size,
        website=request.website,
        country=request.country,
        city=request.city,
        timezone=request.timezone,
        default_language=request.default_language,
        hr_email=request.hr_email or current_user.email,
        contact_number=request.contact_number,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)

    current_user.company_id = company.id
    await db.commit()

    logger.info("User %s created company %s", current_user.id, company.id)
    return CompanyResponse.model_validate(company)
