import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orm import CandidateProfile
from app.repositories.candidate_repository import CandidateRepository
from app.models.candidate_schemas import ScoreBreakdown


class ScoringService:
    def __init__(self, db: AsyncSession):
        self.repo = CandidateRepository(db)

    async def compute(self, profile: CandidateProfile, job_description: str) -> ScoreBreakdown:
        weights = await self.repo.get_scoring_weights()
        jd_lower = job_description.lower()

        skills = profile.skills or []
        experience = profile.experience or []
        education = profile.education or []
        certifications = profile.certifications or []
        projects = profile.projects or []

        skills_score = self._score_skills(skills, jd_lower)
        experience_score = self._score_experience(experience, jd_lower)
        education_score = self._score_education(education, jd_lower)
        certification_score = self._score_certifications(certifications, jd_lower)
        project_score = self._score_projects(projects, jd_lower)

        total_weight = (
            weights.skill_weight
            + weights.experience_weight
            + weights.education_weight
            + weights.certification_weight
            + weights.project_weight
        )

        if total_weight == 0:
            overall = 0
        else:
            overall = (
                skills_score * weights.skill_weight
                + experience_score * weights.experience_weight
                + education_score * weights.education_weight
                + certification_score * weights.certification_weight
                + project_score * weights.project_weight
            ) / total_weight

        return ScoreBreakdown(
            skills_score=round(skills_score, 2),
            experience_score=round(experience_score, 2),
            education_score=round(education_score, 2),
            certification_score=round(certification_score, 2),
            project_score=round(project_score, 2),
            overall_score=round(overall, 2),
        )

    def _score_skills(self, skills: list, jd_lower: str) -> float:
        if not skills:
            return 0
        matched = sum(1 for s in skills if s.lower() in jd_lower)
        return min(matched / max(len(skills), 1), 1.0) * 100

    def _score_experience(self, experience: list, jd_lower: str) -> float:
        if not experience:
            return 30 if "experience" in jd_lower else 50
        years = 0
        for exp in experience:
            dur = str(exp.get("duration", ""))
            nums = re.findall(r"(\d+)", dur)
            if nums:
                years += int(nums[0])
        return min(years / 10, 1.0) * 100 if years > 0 else 50

    def _score_education(self, education: list, jd_lower: str) -> float:
        if not education:
            return 0
        edu_text = " ".join(str(e.get("degree", "")) + " " + str(e.get("institution", "")) for e in education).lower()
        keywords = ["bachelor", "master", "phd", "computer science", "engineering"]
        matched = sum(1 for kw in keywords if kw in edu_text)
        return min(matched / 3, 1.0) * 100

    def _score_certifications(self, certifications: list, jd_lower: str) -> float:
        if not certifications:
            return 0
        matched = sum(1 for c in certifications if c.lower() in jd_lower)
        return min((matched / max(len(certifications), 1)) * 100, 100)

    def _score_projects(self, projects: list, jd_lower: str) -> float:
        if not projects:
            return 0
        techs = []
        for p in projects:
            t = p.get("technologies", "")
            if isinstance(t, list):
                techs.extend(t)
            elif isinstance(t, str):
                techs.append(t)
        matched = sum(1 for t in techs if t.lower() in jd_lower)
        return min((matched / max(len(techs), 1)) * 100, 100) if techs else 50
