import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.orm import Company, Department, UserRole
from app.models.candidate_schemas import CompanyCreate, CompanyUpdate, CompanyResponse, DepartmentCreate, DepartmentResponse
from app.dependencies import get_current_user, require_role, require_company_access, verify_company_ownership

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/companies", tags=["companies"])


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    request: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        for field, value in update_data.items():
            setattr(company, field, value)
        await db.commit()
        await db.refresh(company)

    return CompanyResponse.model_validate(company)


@router.get("/{company_id}/departments", response_model=list[DepartmentResponse])
async def list_departments(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(Department).where(Department.company_id == company_id).order_by(Department.name)
    )
    return [DepartmentResponse.model_validate(row) for row in result.scalars().all()]


@router.post("/{company_id}/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    company_id: str,
    request: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(select(Company).where(Company.id == company_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Company not found")

    dept = Department(
        id=str(uuid.uuid4()),
        company_id=company_id,
        name=request.name,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)

    return DepartmentResponse.model_validate(dept)
