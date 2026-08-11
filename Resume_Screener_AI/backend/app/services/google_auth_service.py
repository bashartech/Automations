import json
import logging
from datetime import datetime, timezone
from typing import Optional
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.models.orm import GoogleToken

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
]


def _naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=None)


class GoogleAuthService:
    def __init__(self, db: AsyncSession, company_id: str):
        self.db = db
        self.company_id = company_id
        self.settings = get_settings()

    def _build_flow(self, redirect_uri: str) -> Flow:
        client_config = {
            "web": {
                "client_id": self.settings.google_client_id,
                "client_secret": self.settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            autogenerate_code_verifier=False,
        )
        flow.redirect_uri = redirect_uri
        return flow

    def get_auth_url(self, redirect_uri: Optional[str] = None, state: Optional[str] = None) -> str:
        redirect_uri = redirect_uri or self.settings.google_redirect_uri
        flow = self._build_flow(redirect_uri)
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state or self.company_id,
        )
        return auth_url

    async def exchange_code(self, code: str, redirect_uri: Optional[str] = None) -> bool:
        redirect_uri = redirect_uri or self.settings.google_redirect_uri
        flow = self._build_flow(redirect_uri)
        flow.fetch_token(code=code)
        creds = flow.credentials

        token_data = {
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": " ".join(creds.scopes),
            "expiry": _naive_utc(creds.expiry),
        }

        existing = await self.db.execute(
            select(GoogleToken).where(GoogleToken.company_id == self.company_id)
        )
        record = existing.scalar_one_or_none()
        if record:
            for k, v in token_data.items():
                setattr(record, k, v)
        else:
            record = GoogleToken(
                company_id=self.company_id,
                **token_data,
            )
            self.db.add(record)
        await self.db.commit()
        logger.info("Google OAuth tokens stored for company %s", self.company_id)
        return True

    async def get_credentials(self) -> Optional[Credentials]:
        result = await self.db.execute(
            select(GoogleToken).where(GoogleToken.company_id == self.company_id)
        )
        record = result.scalar_one_or_none()
        if not record:
            logger.warning("No Google tokens found for company %s", self.company_id)
            return None

        creds = Credentials(
            token=record.access_token,
            refresh_token=record.refresh_token,
            token_uri=record.token_uri,
            client_id=record.client_id,
            client_secret=record.client_secret,
            scopes=record.scopes.split(),
            expiry=_naive_utc(record.expiry),
        )

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            record.access_token = creds.token
            record.expiry = _naive_utc(creds.expiry)
            await self.db.commit()
            logger.info("Google token refreshed for company %s", self.company_id)

        return creds
