import json
import logging
from app.services.async_ai_client import AsyncAIClient

logger = logging.getLogger(__name__)

JD_REVIEW_SYSTEM_PROMPT = """You are an expert Job Description Reviewer. Analyze the given job description and provide structured feedback.

Return ONLY valid JSON with this exact structure:
{
  "suggestions": ["List of specific suggestions to improve the JD"],
  "missing_skills": ["Skills that should be listed but are missing"],
  "grammar_issues": ["Any grammar, spelling, or clarity issues found"],
  "inclusive_language_suggestions": ["Suggestions for more inclusive language"],
  "recommendation": "approve" or "revision",
  "overall_quality_score": 0.0 to 100.0,
  "improved_description": "A complete, rewritten and improved version of the job description incorporating all fixes"
}

Guidelines:
- Check for clear job title, responsibilities, required skills, preferred skills
- Look for inclusive language (avoid "him/her", "he/she", "man-hours", etc.)
- Ensure required vs preferred skills are clearly distinguished
- Suggest improvements for clarity and completeness
- Score below 60 should recommend revision, above 60 may recommend approve
- improved_description MUST be a full, ready-to-use job description (not a summary) with correct grammar, inclusive language, and clear sections"""


class JDAgent:
    def __init__(self):
        self.ai_client = AsyncAIClient()

    async def review(self, title: str, description: str, required_skills: list[str] | None = None) -> dict:
        skills_text = f"\nRequired Skills: {', '.join(required_skills)}" if required_skills else ""

        messages = [
            {"role": "system", "content": JD_REVIEW_SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this job description:\n\nTitle: {title}\n{skills_text}\n\nDescription:\n{description[:30000]}"},
        ]

        raw = await self.ai_client.chat_completion(messages, response_format="json")

        try:
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            result = json.loads(cleaned)
            result.setdefault("suggestions", [])
            result.setdefault("missing_skills", [])
            result.setdefault("grammar_issues", [])
            result.setdefault("inclusive_language_suggestions", [])
            result.setdefault("recommendation", "revision")
            result.setdefault("overall_quality_score", 0.0)
            result.setdefault("improved_description", description)
            return result
        except (json.JSONDecodeError, KeyError) as e:
            logger.error("Failed to parse JD review result: %s — raw: %s", e, raw[:500])
            return {
                "suggestions": [],
                "missing_skills": [],
                "grammar_issues": [],
                "inclusive_language_suggestions": [],
                "recommendation": "revision",
                "overall_quality_score": 0.0,
                "improved_description": description,
            }
