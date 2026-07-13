import json
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai_service import AIService, _parse_json_response
from app.models.orm import CandidateProfile
from app.repositories.candidate_repository import CandidateRepository

logger = logging.getLogger(__name__)


class ProfileExtractionService:
    def __init__(self, db: AsyncSession, user_id: Optional[str] = None):
        self.ai = AIService()
        self.repo = CandidateRepository(db, user_id)

    async def extract(self, text: str, resume_id: Optional[str] = None, user_id: Optional[str] = None) -> CandidateProfile:
        prompt = f"""Extract a structured candidate profile from the resume text below.

Rules:
- name: MUST extract the person's full name from the resume. If you see a name at the top, use it. Never return null for name.
- email: Extract email address if present, otherwise null
- phone: Extract phone number if present, otherwise null
- linkedin: Extract LinkedIn URL if present, otherwise null
- github: Extract GitHub URL if present, otherwise null
- location: Extract city/country if present, otherwise null
- summary: Write a 2-3 sentence professional summary
- skills: Extract ALL technical and professional skills mentioned
- experience: Array of {{title, company, duration, description}}
- education: Array of {{degree, institution, year}}
- certifications: Array of certification names
- projects: Array of {{name, description, technologies}}

Return ONLY valid JSON, no other text.

Resume text:
{text}"""

        response = await self._call_ai(prompt)

        name = response.get("name")
        if not name:
            import re
            lines = text.strip().split('\n')
            for line in lines[:10]:
                line = line.strip()
                if line and len(line) > 2 and not re.search(r'[\d@]', line):
                    name = line.strip()
                    break

        profile = CandidateProfile(
            resume_id=resume_id,
            raw_text=text,
            name=name,
            email=response.get("email"),
            phone=response.get("phone"),
            linkedin=response.get("linkedin"),
            github=response.get("github"),
            location=response.get("location"),
            summary=response.get("summary"),
            skills=response.get("skills", []),
            experience=response.get("experience", []),
            education=response.get("education", []),
            certifications=response.get("certifications", []),
            projects=response.get("projects", []),
        )

        return await self.repo.create_profile(profile)

    async def _call_ai(self, prompt: str) -> dict:
        response = self.ai.client.chat.completions.create(
            model=self.ai.model,
            messages=[
                {"role": "system", "content": "You are a resume parser. Return ONLY a JSON object (not an array). Never wrap results in []. Never add text before or after the JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=self.ai.temperature,
            max_tokens=self.ai.max_tokens,
        )
        finish = response.choices[0].finish_reason
        if finish == "length":
            logger.warning("AI response was truncated (finish_reason=length)")
        return _parse_json_response(response.choices[0].message.content)
