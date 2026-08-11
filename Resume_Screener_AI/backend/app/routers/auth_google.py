import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.orm import User
from app.services.google_auth_service import GoogleAuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/google/auth", tags=["google-auth"])


@router.get("/url")
async def get_auth_url(
    company_id: str = Query(...),
    redirect_uri: str = Query(None, description="OAuth redirect URI (backend callback URL)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "SUPER_ADMIN" and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not allowed for this company")
    svc = GoogleAuthService(db, company_id)
    auth_url = svc.get_auth_url(redirect_uri, state=company_id)
    return {"auth_url": auth_url}


@router.get("/callback")
async def auth_callback(
    code: str = Query(...),
    state: str = Query(None, description="company_id passed through OAuth state"),
    redirect_uri: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    company_id = state or redirect_uri
    if not company_id or company_id.startswith("http"):
        raise HTTPException(status_code=400, detail="Missing state (company_id) in callback")
    svc = GoogleAuthService(db, company_id)
    success = await svc.exchange_code(code, redirect_uri)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to exchange OAuth code")
    return {
        "message": "Google authorized successfully. Gmail and Calendar are now connected for this company.",
        "company_id": company_id,
    }


@router.get("/status")
async def auth_status(
    company_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "SUPER_ADMIN" and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not allowed for this company")
    svc = GoogleAuthService(db, company_id)
    creds = await svc.get_credentials()
    return {
        "company_id": company_id,
        "authorized": creds is not None,
        "email": getattr(creds, "email", None) if creds else None,
    }
