from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.orm import User, UserRole
from app.auth_utils import decode_token


async def get_current_user(
    authorization: str = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        user_id = decode_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(
    authorization: str = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        user_id = decode_token(token)
    except ValueError:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def require_role(*allowed_roles: UserRole):
    async def _require_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of: {', '.join(r.value for r in allowed_roles)}",
            )
        return current_user
    return _require_role


async def require_company_access(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="User does not belong to a company")
    return current_user


async def verify_company_ownership(
    company_id: str,
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.company_id != company_id:
            raise HTTPException(status_code=403, detail="Access denied: company mismatch")
    return current_user
