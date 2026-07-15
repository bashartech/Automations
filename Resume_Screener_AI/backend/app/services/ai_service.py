import json
import re
import logging
from openai import OpenAI
from app.config import get_settings
from app.models.schemas import SkillExtractResponse, MatchResponse

logger = logging.getLogger(__name__)

MAX_AI_CONTEXT_CHARS = 3000


def _truncate_text(text: str, max_chars: int = MAX_AI_CONTEXT_CHARS) -> str:
    if len(text) > max_chars:
        half = max_chars // 2
        return text[:half] + "\n...[TRUNCATED]...\n" + text[-half:]
    return text


def _parse_json_response(content: str) -> dict:
    """Robustly extract and parse a JSON object from an AI response."""
    raw = content.strip()
    if not raw:
        raise ValueError("AI returned empty response")

    # Strip markdown code blocks
    if raw.startswith("```"):
        raw = raw.lstrip("` ").removeprefix("json").strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    # --- Strategy 1: try direct parse ---
    def _try_parse(text: str):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None

    parsed = _try_parse(raw)
    if parsed is not None:
        if isinstance(parsed, list):
            if len(parsed) > 0 and isinstance(parsed[0], dict):
                logger.warning("AI returned JSON array, using first element as object")
                return parsed[0]
            raise ValueError(f"AI returned unexpected JSON array: {raw[:200]}")
        if isinstance(parsed, dict):
            return parsed
        raise TypeError(f"AI returned unexpected JSON type: {type(parsed).__name__}")

    # --- Strategy 2: find top-level object via brace counting ---
    brace_depth = 0
    obj_start = -1
    for i, ch in enumerate(raw):
        if ch == '{':
            if brace_depth == 0:
                obj_start = i
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth == 0 and obj_start >= 0:
                candidate = raw[obj_start:i+1]
                parsed = _try_parse(candidate)
                if parsed is not None:
                    return parsed
                obj_start = -1

    # --- Strategy 3: try to fix truncated JSON ---
    fixed = raw.rstrip(',').rstrip('},').rstrip('}') + '}'
    parsed = _try_parse(fixed)
    if parsed is not None:
        logger.warning("Recovered truncated JSON by appending closing brace")
        return parsed

    # --- Strategy 4: find JSON array top-level via bracket counting ---
    bracket_depth = 0
    arr_start = -1
    for i, ch in enumerate(raw):
        if ch == '[':
            if bracket_depth == 0:
                arr_start = i
            bracket_depth += 1
        elif ch == ']':
            bracket_depth -= 1
            if bracket_depth == 0 and arr_start >= 0:
                candidate = raw[arr_start:i+1]
                parsed = _try_parse(candidate)
                if parsed is not None:
                    if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                        return parsed[0]
                    if isinstance(parsed, dict):
                        return parsed

    logger.error("Failed to parse AI response as JSON. Raw (first 1500): %s", raw[:1500])
    raise ValueError(
        f"Could not extract valid JSON from AI response (len={len(raw)}). "
        f"First 200: {raw[:200]}"
    )

class AIService:
    def __init__(self):
        settings = get_settings()
        self.provider = settings.ai_provider.lower()

        if self.provider == "groq":
            self.client = OpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            self.model = settings.groq_model
            self.temperature = settings.groq_temperature
            self.max_tokens = settings.groq_max_tokens
        else:
            self.client = OpenAI(
                api_key=settings.gemini_api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
            self.model = settings.gemini_model
            self.temperature = 0.3
            self.max_tokens = 1024

    def extract_skills(self, resume_text: str) -> SkillExtractResponse:
        """Extract skills, experience, and education from resume text"""
        text = _truncate_text(resume_text)
        prompt = f"""Analyze the following resume and extract:
1. All technical and professional skills (programming languages, frameworks, tools, soft skills)
2. Total years of experience (estimate if not explicitly stated)
3. Education background (degrees, institutions)

Resume:
{text}

Respond in JSON format:
{{
    "skills": ["skill1", "skill2", ...],
    "experience_years": number or null,
    "education": "education summary" or null
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert resume analyzer. Extract information accurately and return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            content = response.choices[0].message.content
            # Parse JSON response
            data = json.loads(content)

            return SkillExtractResponse(
                skills=data.get("skills", []),
                experience_years=data.get("experience_years"),
                education=data.get("education")
            )
        except Exception as e:
            raise Exception(f"Error extracting skills: {str(e)}")

    def match_resume_to_job(self, resume_text: str, job_description: str) -> MatchResponse:
        """Match resume against job description and calculate match percentage"""
        text = _truncate_text(resume_text)
        prompt = f"""Compare the following resume with the job description and provide:
1. Match percentage (0-100) based on skills, experience, and qualifications
2. List of matched skills/qualifications
3. List of missing skills/qualifications from the job description
4. Brief summary of the match

Resume:
{text}

Job Description:
{job_description}

Respond in JSON format:
{{
    "match_percentage": number (0-100),
    "matched_skills": ["skill1", "skill2", ...],
    "missing_skills": ["skill1", "skill2", ...],
    "summary": "brief summary of match quality"
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert recruiter. Analyze resume-job matches accurately and return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            content = response.choices[0].message.content

            print("[DEBUG] AI raw response for match_resume_to_job:", repr(content))
            # Remove code block markers if present
            if content.strip().startswith("```"):
                content = content.strip().lstrip("` ").removeprefix("json").strip()
                if content.endswith("```"):
                    content = content[:-3].strip()
            # Parse JSON response
            data = json.loads(content)

            return MatchResponse(
                match_percentage=data.get("match_percentage", 0),
                matched_skills=data.get("matched_skills", []),
                missing_skills=data.get("missing_skills", []),
                summary=data.get("summary", "")
            )
        except Exception as e:
            raise Exception(f"Error matching resume: {str(e)}")
