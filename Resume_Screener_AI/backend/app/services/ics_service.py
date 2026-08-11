from datetime import datetime, timedelta, timezone
from typing import Optional


class ICSService:
    @classmethod
    def generate(cls, summary: str, description: str, date: str, time: str,
                 timezone_str: str, duration_minutes: int = 60,
                 location: str = "", organizer: str = "hr@company.com",
                 attendee: str = "") -> str:
        dt_start = cls._parse_datetime(date, time, timezone_str)
        dt_end = dt_start + timedelta(minutes=duration_minutes)

        now = datetime.now(timezone.utc)
        uid = f"{now.timestamp():.0f}-{hash(summary + date + time)}@resume-screener"

        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Resume Screener//AI Scheduling//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{cls._format_dt(now)}",
            f"DTSTART:{cls._format_dt(dt_start)}",
            f"DTEND:{cls._format_dt(dt_end)}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
        ]
        if location:
            lines.append(f"LOCATION:{location}")
        if organizer:
            lines.append(f"ORGANIZER;CN=HR Team:mailto:{organizer}")
        if attendee:
            lines.append(f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{attendee}")
        lines.extend([
            "BEGIN:VALARM",
            "TRIGGER:-PT24H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Interview tomorrow",
            "END:VALARM",
            "BEGIN:VALARM",
            "TRIGGER:-PT1H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Interview in 1 hour",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR",
        ])
        return "\r\n".join(lines)

    @classmethod
    def _parse_datetime(cls, date: str, time: str, timezone_str: str) -> datetime:
        try:
            dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        except ValueError:
            try:
                dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %I:%M %p")
            except ValueError:
                dt = datetime.now(timezone.utc)
        return dt.replace(tzinfo=timezone.utc)

    @classmethod
    def _format_dt(cls, dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%SZ")
