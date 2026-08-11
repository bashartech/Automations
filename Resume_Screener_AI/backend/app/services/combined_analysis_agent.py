import logging
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.ai_service import AIService, _parse_json_response, _truncate_text
from app.services.categorization_service import CategorizationService
from app.models.orm import (
    CandidateProfile, CandidateScore, CandidateCategory,
    CompanyKnowledge,
)
from app.repositories.candidate_repository import CandidateRepository

logger = logging.getLogger(__name__)

HYBRID_AI_WEIGHT = 0.6
HYBRID_RULE_WEIGHT = 0.4


class CombinedAnalysisAgent:
    def __init__(self, db: AsyncSession):
        self.ai = AIService()
        self.repo = CandidateRepository(db)
        self.db = db
        self.categorization = CategorizationService()

    async def analyze(self, profile_id: str, job_id: str, job_description: str) -> CandidateScore:
        profile = await self.repo.get_profile(profile_id)
        if not profile:
            raise ValueError("Candidate profile not found")

        company_knowledge_text = await self._get_company_knowledge_text(profile.company_id)

        ai_result = await self._call_ai_combined(profile, job_description, company_knowledge_text)

        rule_result = self._rule_based_scoring(profile, job_description)

        final = self._hybrid_merge(ai_result, rule_result)

        # Clamp all scores to 0-100
        for key in ("overall_score", "technical_score", "experience_score",
                     "skill_match_score", "education_score", "project_score",
                     "culture_fit_score", "confidence_score"):
            val = final.get(key, 0)
            final[key] = max(0.0, min(100.0, float(val)))

        category = self.categorization.categorize(final.get("overall_score", 0))

        score_record = CandidateScore(
            candidate_id=profile_id,
            job_id=job_id,
            overall_score=final.get("overall_score"),
            technical_score=final.get("technical_score"),
            experience_score=final.get("experience_score"),
            skill_match_score=final.get("skill_match_score"),
            education_score=final.get("education_score"),
            project_score=final.get("project_score"),
            culture_fit_score=final.get("culture_fit_score"),
            confidence_score=final.get("confidence_score"),
            missing_skills=final.get("missing_skills", []),
            strengths=final.get("strengths", []),
            weaknesses=final.get("weaknesses", []),
            risks=final.get("risks", []),
            ai_recommendation=final.get("recommendation", ""),
            ai_explanation=final.get("explanation", ""),
            hybrid_score=final.get("overall_score"),
        )
        score_record = await self.repo.upsert_candidate_score(score_record)

        await self.repo.update_profile(profile_id, {
            "overall_score": final.get("overall_score"),
            "category": category.value,
        })

        return score_record

    async def _get_company_knowledge_text(self, company_id: Optional[str]) -> str:
        if not company_id:
            return ""
        result = await self.db.execute(
            select(CompanyKnowledge).where(CompanyKnowledge.company_id == company_id)
        )
        ck: Optional[CompanyKnowledge] = result.scalar_one_or_none()
        if not ck:
            return ""
        parts = []
        if ck.mission:
            parts.append(f"Mission: {ck.mission}")
        if ck.vision:
            parts.append(f"Vision: {ck.vision}")
        if ck.culture:
            parts.append(f"Culture: {ck.culture}")
        if ck.core_values:
            parts.append(f"Core Values: {', '.join(ck.core_values)}")
        if ck.work_environment:
            parts.append(f"Work Environment: {ck.work_environment}")
        if ck.remote_policy:
            parts.append(f"Remote Policy: {ck.remote_policy}")
        if ck.hiring_policy:
            parts.append(f"Hiring Policy: {ck.hiring_policy}")
        if ck.preferred_skills:
            parts.append(f"Preferred Skills: {', '.join(ck.preferred_skills)}")
        return "\n".join(parts)

    async def _call_ai_combined(self, profile: CandidateProfile, job_description: str,
                                 company_knowledge_text: str) -> Dict[str, Any]:
        context_parts = []
        if company_knowledge_text:
            context_parts.append(f"Company Knowledge:\n{company_knowledge_text}")
        context_parts.append(f"Job Description:\n{job_description}")
        context_str = "\n\n".join(context_parts)

        prompt = f"""You are an expert technical recruiter. Analyze this candidate against the job and company context.

Company & Job Context:
{_truncate_text(context_str, 4000)}

Candidate Profile:
Name: {profile.name}
Skills: {_truncate_text(str(profile.skills or ""), 1500)}
Experience: {_truncate_text(str(profile.experience or ""), 1500)}
Education: {_truncate_text(str(profile.education or ""), 1000)}
Certifications: {_truncate_text(str(profile.certifications or ""), 800)}
Projects: {_truncate_text(str(profile.projects or ""), 1500)}
Summary: {_truncate_text(str(profile.summary or ""), 500)}

Return ONLY valid JSON:
{{
    "overall_score": 0-100,
    "technical_score": 0-100,
    "experience_score": 0-100,
    "skill_match_score": 0-100,
    "education_score": 0-100,
    "project_score": 0-100,
    "culture_fit_score": 0-100,
    "confidence_score": 0-100,
    "missing_skills": ["skill1", "skill2"],
    "strengths": ["✓ item1", "✓ item2"],
    "weaknesses": ["✗ item1", "✗ item2"],
    "risks": ["risk1", "risk2"],
    "recommendation": "Strongly Recommend / Recommend / Consider / Do Not Recommend",
    "explanation": "Human-readable paragraph justifying the overall score"
}}

Guidelines:
- overall_score: overall match (0-100)
- technical_score: technical skills match (0-100)
- experience_score: relevant experience match (0-100)
- skill_match_score: how well candidate skills match job requirements (0-100)
- education_score: education relevance (0-100)
- project_score: project relevance (0-100)
- culture_fit_score: alignment with company culture/values (0-100)
- confidence_score: how confident you are in this assessment (0-100)
- A strong match is 80-100, good 65-79, average 50-64, weak 35-49, reject <35
- Be honest. Consider semantic meaning, not just keywords."""

        response = self.ai.client.chat.completions.create(
            model=self.ai.model,
            messages=[
                {"role": "system", "content": "You are an expert technical recruiter. Return ONLY a valid JSON object. Never wrap in arrays or markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=self.ai.temperature,
            max_tokens=self.ai.max_tokens,
        )
        finish = response.choices[0].finish_reason
        if finish == "length":
            logger.warning("AI analysis response was truncated (finish_reason=length)")

        return _parse_json_response(response.choices[0].message.content)

    def _rule_based_scoring(self, profile: CandidateProfile, job_description: str) -> Dict[str, Any]:
        profile_skills = set(s.lower().strip() for s in (profile.skills or []))
        jd_lower = job_description.lower()

        skill_match = self._keyword_match_score(list(profile_skills), jd_lower)
        experience = self._experience_score(profile.experience or [])
        education = self._education_score(profile.education or [])
        project = self._project_score(profile.projects or [])

        overall = round(0.35 * skill_match + 0.30 * experience + 0.20 * education + 0.15 * project, 1)

        return {
            "overall_score": overall,
            "technical_score": skill_match,
            "experience_score": experience,
            "skill_match_score": skill_match,
            "education_score": education,
            "project_score": project,
            "culture_fit_score": 50.0,
            "confidence_score": 70.0,
        }

    def _hybrid_merge(self, ai: Dict[str, Any], rule: Dict[str, Any]) -> Dict[str, Any]:
        merged: Dict[str, Any] = {}
        score_keys = [
            "overall_score", "technical_score", "experience_score",
            "skill_match_score", "education_score", "project_score",
            "culture_fit_score", "confidence_score",
        ]
        for key in score_keys:
            ai_val = ai.get(key, 50)
            rule_val = rule.get(key, 50)
            merged[key] = round(HYBRID_AI_WEIGHT * ai_val + HYBRID_RULE_WEIGHT * rule_val, 1)

        for list_key in ("missing_skills", "strengths", "weaknesses", "risks"):
            merged[list_key] = ai.get(list_key, [])

        merged["recommendation"] = ai.get("recommendation", "Consider")
        merged["explanation"] = ai.get("explanation", "")
        return merged

    def _keyword_match_score(self, profile_skills: List[str], jd_lower: str) -> float:
        if not profile_skills:
            return 0.0
        matched = sum(1 for s in profile_skills if s in jd_lower)
        return min(100.0, round((matched / len(profile_skills)) * 100, 1))

    def _experience_score(self, experience: List[dict]) -> float:
        if not experience:
            return 0.0
        total_years = 0
        for exp in experience:
            dur = exp.get("duration", "")
            years = self._parse_years(dur)
            total_years += years
        if total_years >= 10:
            return 90.0
        if total_years >= 7:
            return 80.0
        if total_years >= 5:
            return 70.0
        if total_years >= 3:
            return 60.0
        if total_years >= 1:
            return 40.0
        return 20.0

    def _education_score(self, education: List[dict]) -> float:
        if not education:
            return 0.0
        degrees = set()
        for edu in education:
            deg = (edu.get("degree") or "").lower()
            degrees.add(deg)
        if any("phd" in d or "ph.d" in d for d in degrees):
            return 90.0
        if any("master" in d or "m.s." in d or "m.sc" in d for d in degrees):
            return 80.0
        if any("bachelor" in d or "b.s." in d or "b.sc" in d or "b.tech" in d for d in degrees):
            return 70.0
        if any("associate" in d for d in degrees):
            return 50.0
        return 40.0

    def _project_score(self, projects: List[dict]) -> float:
        if not projects:
            return 0.0
        count = len(projects)
        if count >= 5:
            return 90.0
        if count >= 3:
            return 70.0
        return 50.0

    def _parse_years(self, duration: str) -> float:
        if not duration:
            return 0
        years = re.findall(r'(\d+)\s*y(?:ea)?r', duration, re.IGNORECASE)
        months = re.findall(r'(\d+)\s*month', duration, re.IGNORECASE)
        total = sum(int(y) for y in years)
        total += sum(int(m) for m in months) / 12.0
        return total
