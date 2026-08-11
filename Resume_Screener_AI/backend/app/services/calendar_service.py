import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.services.google_auth_service import GoogleAuthService

logger = logging.getLogger(__name__)


class CalendarService:
    def __init__(self, db: Optional[AsyncSession] = None, company_id: Optional[str] = None):
        settings = get_settings()
        self.mock = settings.mock_external_services
        self.calendar_id = settings.google_calendar_calendar_id or "primary"
        self.db = db
        self.company_id = company_id

    async def create_meet_link(self, summary: str, date: str, time: str,
                                timezone: str, duration_minutes: int = 60) -> Optional[str]:
        if self.mock:
            link = f"https://meet.google.com/{uuid.uuid4().hex[:12]}"
            logger.info("MOCK: Created Google Meet link: %s", link)
            return link

        if not self.db or not self.company_id:
            logger.warning("CalendarService: no db/company_id provided, using mock")
            return f"https://meet.google.com/{uuid.uuid4().hex[:12]}"

        try:
            return await self._call_google_api(summary, date, time, timezone, duration_minutes)
        except Exception as e:
            logger.warning("Failed to create Meet link via Google API: %s", e)
            return None

    async def _call_google_api(self, summary: str, date: str, time: str,
                                timezone: str, duration_minutes: int) -> Optional[str]:
        auth = GoogleAuthService(self.db, self.company_id)
        creds = await auth.get_credentials()
        if not creds:
            raise RuntimeError("Google not authorized — run /api/google/auth first")

        service = build("calendar", "v3", credentials=creds)

        dt_start = self._parse_dt(date, time, timezone)
        dt_end = dt_start + timedelta(minutes=duration_minutes)

        event = {
            "summary": summary,
            "start": {
                "dateTime": dt_start.isoformat(),
                "timeZone": timezone,
            },
            "end": {
                "dateTime": dt_end.isoformat(),
                "timeZone": timezone,
            },
            "conferenceData": {
                "createRequest": {
                    "requestId": uuid.uuid4().hex,
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }

        created = (
            service.events()
            .insert(
                calendarId=self.calendar_id,
                body=event,
                conferenceDataVersion=1,
            )
            .execute()
        )

        meet_link = created.get("conferenceData", {}).get("entryPoints", [{}])[0].get("uri", "")
        logger.info("Google Calendar event created: %s (Meet: %s)", created.get("htmlLink"), meet_link)
        return meet_link

    @staticmethod
    def _parse_dt(date: str, time: str, tz: str) -> datetime:
        try:
            dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        except ValueError:
            try:
                dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %I:%M %p")
            except ValueError:
                dt = datetime.now(timezone.utc)
        return dt.replace(tzinfo=timezone.utc)


class MockCalendarService(CalendarService):
    def __init__(self):
        super().__init__()
        self.mock = True
