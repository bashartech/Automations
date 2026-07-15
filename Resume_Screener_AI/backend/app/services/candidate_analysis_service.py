import json
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai_service import AIService, _parse_json_response, _truncate_text
from app.models.orm import CandidateProfile, CandidateCategory
from app.repositories.candidate_repository import CandidateRepository
from app.services.categorization_service import CategorizationService
from app.models.candidate_schemas import AnalyzeResponse, ScoreBreakdown

logger = logging.getLogger(__name__)


class CandidateAnalysisService:
    def __init__(self, db: AsyncSession):
        self.ai = AIService()
        self.repo = CandidateRepository(db)
        self.categorization = CategorizationService()

    async def analyze(self, profile_id: str, job_description: str) -> AnalyzeResponse:
        profile = await self.repo.get_profile(profile_id)
        if not profile:
            raise ValueError("Candidate profile not found")

        prompt = f"""Analyze this candidate against the job description and return a match score.

Candidate Profile:
Name: {profile.name}
Skills: {_truncate_text(str(profile.skills or ""), 1000)}
Experience: {_truncate_text(str(profile.experience or ""), 1000)}
Education: {_truncate_text(str(profile.education or ""), 800)}
Certifications: {_truncate_text(str(profile.certifications or ""), 800)}
Projects: {_truncate_text(str(profile.projects or ""), 1500)}
Summary: {_truncate_text(str(profile.summary or ""), 500)}

Job Description:
{job_description}

Return ONLY valid JSON:
{{
    "overall_score": 0-100,
    "skills_score": 0-100,
    "experience_score": 0-100,
    "education_score": 0-100,
    "certification_score": 0-100,
    "project_score": 0-100,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "missing_requirements": ["..."],
    "recommendation": "Strongly Recommend / Recommend / Consider / Do Not Recommend",
    "summary": "brief analysis summary"
}}

Scoring guidelines:
- overall_score: overall match percentage (0-100)
- skills_score: how well candidate's skills match job requirements
- experience_score: relevance of candidate's experience to the role
- education_score: relevance of candidate's education
- certification_score: relevance of certifications
- project_score: relevance of past projects
Be honest and realistic. A strong match is 80-100, good is 65-79, average is 50-64, weak is 35-49, reject is below 35."""

        response = self.ai.client.chat.completions.create(
            model=self.ai.model,
            messages=[
                {"role": "system", "content": "You are an expert technical recruiter. Return ONLY a JSON object (not an array). Never wrap results in []. Never add text before or after the JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=self.ai.temperature,
            max_tokens=1024,
        )
        finish = response.choices[0].finish_reason
        if finish == "length":
            logger.warning("AI analysis response was truncated (finish_reason=length)")
        analysis = _parse_json_response(response.choices[0].message.content)

        overall = analysis.get("overall_score", 50)
        category = self.categorization.categorize(overall)
        score_breakdown = ScoreBreakdown(
            skills_score=analysis.get("skills_score", 0),
            experience_score=analysis.get("experience_score", 0),
            education_score=analysis.get("education_score", 0),
            certification_score=analysis.get("certification_score", 0),
            project_score=analysis.get("project_score", 0),
            overall_score=overall,
        )

        await self.repo.update_profile(profile_id, {
            "overall_score": overall,
            "category": category.value,
        })

        return AnalyzeResponse(
            candidate_name=profile.name,
            overall_score=overall,
            scores=score_breakdown,
            strengths=analysis.get("strengths", []),
            weaknesses=analysis.get("weaknesses", []),
            missing_requirements=analysis.get("missing_requirements", []),
            recommendation=analysis.get("recommendation", ""),
            summary=analysis.get("summary", ""),
            category=category,
        )
