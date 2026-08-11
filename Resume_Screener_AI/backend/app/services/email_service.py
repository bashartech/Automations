import base64
import logging
from email.mime.text import MIMEText
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.services.google_auth_service import GoogleAuthService

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self, db: Optional[AsyncSession] = None, company_id: Optional[str] = None):
        settings = get_settings()
        self.mock = settings.mock_external_services
        self.db = db
        self.company_id = company_id

    async def send_interview_email(self, to_email: str, candidate_name: str,
                                    date: str, time: str, timezone: str,
                                    meet_link: str, interviewer: Optional[str] = None,
                                    notes: Optional[str] = None) -> bool:
        if self.mock:
            logger.info(
                "MOCK: Interview email to %s\n"
                "  Candidate: %s\n  Date: %s %s %s\n  Meet: %s\n  Interviewer: %s\n  Notes: %s",
                to_email, candidate_name, date, time, timezone,
                meet_link, interviewer or "TBD", notes or "",
            )
            return True

        if not self.db or not self.company_id:
            logger.warning("EmailService: no db/company_id provided, using mock")
            return True

        try:
            return await self._send_via_gmail(to_email, candidate_name, date, time,
                                              timezone, meet_link, interviewer, notes)
        except Exception as e:
            logger.warning("Failed to send interview email: %s", e)
            return False

    async def _send_via_gmail(self, to_email: str, candidate_name: str,
                               date: str, time: str, timezone: str,
                               meet_link: str, interviewer: Optional[str] = None,
                               notes: Optional[str] = None) -> bool:
        auth = GoogleAuthService(self.db, self.company_id)
        creds = await auth.get_credentials()
        if not creds:
            raise RuntimeError("Google not authorized — run /api/google/auth first")

        subject = f"Interview Scheduled: {candidate_name}"
        body_lines = [
            f"Dear {candidate_name},",
            "",
            "Your interview has been scheduled.",
            f"Date: {date}",
            f"Time: {time}",
            f"Timezone: {timezone}",
            f"Meeting Link: {meet_link}",
            f"Interviewer: {interviewer or 'TBD'}",
        ]
        if notes:
            body_lines.append(f"Notes: {notes}")
        body_lines.extend(["", "Best regards,", "HR Team"])
        body = "\n".join(body_lines)

        message = MIMEText(body)
        message["to"] = to_email
        message["from"] = "me"
        message["subject"] = subject

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        service = build("gmail", "v1", credentials=creds)
        try:
            service.users().messages().send(userId="me", body={"raw": raw}).execute()
            logger.info("Interview email sent to %s via Gmail API", to_email)
            return True
        except HttpError as e:
            logger.warning("Gmail API error: %s", e)
            return False


class MockEmailService(EmailService):
    def __init__(self):
        super().__init__()
        self.mock = True
