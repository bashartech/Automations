import json
import logging
from app.services.async_ai_client import AsyncAIClient

logger = logging.getLogger(__name__)

KNOWLEDGE_EXTRACT_SYSTEM_PROMPT = """You are an AI Knowledge Extraction Agent. Your job is to analyze company documents (handbook, policy, culture docs, interview guides) and extract structured company knowledge.

Extract as many of the following fields as possible from the document text. Return ONLY valid JSON with these keys:

{
  "mission": "string or null",
  "vision": "string or null",
  "culture": "string or null",
  "core_values": ["string"] or null,
  "work_environment": "string or null",
  "remote_policy": "string or null",
  "working_hours": "string or null",
  "interview_process": "string or null",
  "interview_stages": ["string"] or null,
  "hiring_policy": "string or null",
  "required_documents": ["string"] or null,
  "preferred_skills": ["string"] or null,
  "communication_style": "string or null",
  "interview_days": [0-6 integers, 0=Monday] or null,
  "interview_time_slots": ["09:00-10:00"] or null,
  "meeting_duration": 60 (integer, minutes),
  "timezone": "UTC (string or null)"
}

If a field cannot be determined from the document, set it to null. Be thorough - extract every detail you can find."""


class KnowledgeAgent:
    def __init__(self):
        self.ai_client = AsyncAIClient()

    async def extract_from_document(self, text: str) -> dict:
        messages = [
            {"role": "system", "content": KNOWLEDGE_EXTRACT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract company knowledge from this document:\n\n{text[:30000]}"},
        ]
        raw = await self.ai_client.chat_completion(messages, response_format="json")

        try:
            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            result = json.loads(cleaned)

            # Ensure all expected keys exist
            expected_keys = [
                "mission", "vision", "culture", "core_values", "work_environment",
                "remote_policy", "working_hours", "interview_process", "interview_stages",
                "hiring_policy", "required_documents", "preferred_skills",
                "communication_style", "interview_days", "interview_time_slots",
                "meeting_duration", "timezone",
            ]
            for key in expected_keys:
                result.setdefault(key, None)

            return result
        except (json.JSONDecodeError, KeyError) as e:
            logger.error("Failed to parse knowledge extraction result: %s — raw: %s", e, raw[:500])
            return {key: None for key in [
                "mission", "vision", "culture", "core_values", "work_environment",
                "remote_policy", "working_hours", "interview_process", "interview_stages",
                "hiring_policy", "required_documents", "preferred_skills",
                "communication_style", "interview_days", "interview_time_slots",
                "meeting_duration", "timezone",
            ]}
