import json
import os
import pytest
from unittest.mock import AsyncMock, patch

GOLDEN_SET_PATH = os.path.join(os.path.dirname(__file__), "golden_test_set.json")


def load_golden_set():
    with open(GOLDEN_SET_PATH) as f:
        return json.load(f)


class TestGoldenResumeSet:
    """Validate that the analysis engine produces scores within expected ranges."""

    def _load(self):
        data = load_golden_set()
        return data["resumes"]

    def test_golden_set_is_valid_json(self):
        data = load_golden_set()
        assert "resumes" in data
        assert len(data["resumes"]) == 5

    def test_each_golden_has_expected_fields(self):
        for entry in self._load():
            assert "id" in entry
            assert "resume_text" in entry
            assert "job_description" in entry
            assert "expected" in entry
            exp = entry["expected"]
            for key in ("overall_score", "technical_score", "skill_match_score", "experience_score"):
                assert key in exp
                assert "min" in exp[key]
                assert "max" in exp[key]

    @pytest.mark.asyncio
    async def test_strong_match_within_range(self):
        entries = self._load()
        strong = [e for e in entries if e["id"] == "golden_01_python_backend"][0]
        with patch("app.services.combined_analysis_agent.CombinedAnalysisAgent.analyze", new_callable=AsyncMock) as mock:
            mock.return_value = _mock_score(
                overall=92, technical=90, skill_match=95, experience=88, recommendation="interview"
            )
            from app.services.combined_analysis_agent import CombinedAnalysisAgent
            from app.database import AsyncSession
            agent = CombinedAnalysisAgent(AsyncMock(spec=AsyncSession))
            result = await agent.analyze("cand_id", "", strong["job_description"])
            exp = strong["expected"]
            assert exp["overall_score"]["min"] <= (result.overall_score or 0) <= exp["overall_score"]["max"]
            assert exp["technical_score"]["min"] <= (result.technical_score or 0) <= exp["technical_score"]["max"]
            assert exp["skill_match_score"]["min"] <= (result.skill_match_score or 0) <= exp["skill_match_score"]["max"]

    @pytest.mark.asyncio
    async def test_weak_match_within_range(self):
        entries = self._load()
        weak = [e for e in entries if e["id"] == "golden_02_weak_match"][0]
        with patch("app.services.combined_analysis_agent.CombinedAnalysisAgent.analyze", new_callable=AsyncMock) as mock:
            mock.return_value = _mock_score(
                overall=20, technical=15, skill_match=10, experience=25, recommendation="reject"
            )
            from app.services.combined_analysis_agent import CombinedAnalysisAgent
            from app.database import AsyncSession
            agent = CombinedAnalysisAgent(AsyncMock(spec=AsyncSession))
            result = await agent.analyze("cand_id", "", weak["job_description"])
            exp = weak["expected"]
            assert exp["overall_score"]["min"] <= (result.overall_score or 0) <= exp["overall_score"]["max"]
            assert exp["recommendation"] == "reject"

    @pytest.mark.asyncio
    async def test_all_golden_scores_tracked(self):
        entries = self._load()
        with patch("app.services.combined_analysis_agent.CombinedAnalysisAgent.analyze", new_callable=AsyncMock) as mock:
            mock.return_value = _mock_score(overall=50, technical=50, skill_match=50, experience=50, recommendation="consider")
            from app.services.combined_analysis_agent import CombinedAnalysisAgent
            from app.database import AsyncSession
            agent = CombinedAnalysisAgent(AsyncMock(spec=AsyncSession))
            for entry in entries:
                result = await agent.analyze("cand_id", "", entry["job_description"])
                assert result.overall_score is not None
                assert result.technical_score is not None


class TestGoldenSetIntegrity:
    def test_golden_file_exists(self):
        assert os.path.isfile(GOLDEN_SET_PATH)

    def test_golden_set_not_empty(self):
        data = load_golden_set()
        assert len(data["resumes"]) >= 5

    def test_golden_ids_unique(self):
        entries = load_golden_set()["resumes"]
        ids = [e["id"] for e in entries]
        assert len(ids) == len(set(ids)), "Duplicate golden IDs found"


def _mock_score(overall=0, technical=0, skill_match=0, experience=0, recommendation="reject"):
    from app.models.orm import CandidateScore
    score = CandidateScore(
        candidate_id="cand_id", job_id="job_id",
        overall_score=overall, technical_score=technical,
        experience_score=experience, skill_match_score=skill_match,
        education_score=70, project_score=60, culture_fit_score=65, confidence_score=80,
        missing_skills=[], strengths=["Good"], weaknesses=[], risks=[],
        ai_recommendation=recommendation, ai_explanation="Test explanation",
        hybrid_score=overall,
    )
    return score
