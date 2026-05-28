from openai import OpenAI
from app.config import get_settings
from app.models.schemas import SkillExtractResponse, MatchResponse
import json

class AIService:
    def __init__(self):
        settings = get_settings()
        # Configure OpenAI client to use Gemini API
        self.client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        self.model = settings.gemini_model

    def extract_skills(self, resume_text: str) -> SkillExtractResponse:
        """Extract skills, experience, and education from resume text"""
        prompt = f"""Analyze the following resume and extract:
1. All technical and professional skills (programming languages, frameworks, tools, soft skills)
2. Total years of experience (estimate if not explicitly stated)
3. Education background (degrees, institutions)

Resume:
{resume_text}

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
                temperature=0.3
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
        prompt = f"""Compare the following resume with the job description and provide:
1. Match percentage (0-100) based on skills, experience, and qualifications
2. List of matched skills/qualifications
3. List of missing skills/qualifications from the job description
4. Brief summary of the match

Resume:
{resume_text}

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
                temperature=0.3
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
