import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.orm import CandidateProfile, CandidateScore, CandidateCategory


@pytest.fixture
def sample_profile():
    return CandidateProfile(
        id="c1",
        name="Alice Johnson",
        email="alice@example.com",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "AWS"],
        experience=[
            {"title": "Senior Backend Engineer", "company": "TechCorp",
             "duration": "3 years", "description": "Built APIs"},
            {"title": "Backend Developer", "company": "StartupXYZ",
             "duration": "2 years", "description": "Microservices"},
        ],
        education=[
            {"degree": "B.S. Computer Science", "institution": "MIT", "year": "2018"},
            {"degree": "M.S. AI", "institution": "Stanford", "year": "2020"},
        ],
        certifications=["AWS Solutions Architect"],
        projects=[
            {"name": "E-commerce API", "description": "Built with FastAPI", "technologies": ["Python", "FastAPI"]},
            {"name": "Data Pipeline", "description": "ETL pipeline", "technologies": ["Python", "PostgreSQL"]},
            {"name": "ML Service", "description": "Deployed ML models", "technologies": ["Python", "Docker", "AWS"]},
        ],
        summary="Senior backend engineer with 5+ years experience",
        resume_id="r1",
        raw_text="Alice Johnson... extensive backend experience...",
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 1),
    )


class TestRuleBasedScoring:
    @pytest.fixture
    def agent(self):
        from app.services.combined_analysis_agent import CombinedAnalysisAgent
        return CombinedAnalysisAgent.__new__(CombinedAnalysisAgent)

    def test_keyword_match_all_skills_found(self, agent, sample_profile):
        jd = "We need Python, FastAPI, PostgreSQL, Docker, Redis, AWS"
        score = agent._keyword_match_score(
            [s.lower() for s in sample_profile.skills], jd.lower()
        )
        assert score == 100.0

    def test_keyword_match_half_skills(self, agent, sample_profile):
        jd = "We need Python, Java, C++"
        score = agent._keyword_match_score(
            [s.lower() for s in sample_profile.skills], jd.lower()
        )
        assert 15.0 < score < 20.0

    def test_keyword_match_no_skills_empty(self, agent):
        score = agent._keyword_match_score([], "Python developer needed")
        assert score == 0.0

    def test_experience_score_5_years(self, agent):
        exp = [
            {"title": "Dev", "company": "C1", "duration": "3 years"},
            {"title": "Sr Dev", "company": "C2", "duration": "2 years"},
        ]
        score = agent._experience_score(exp)
        assert score == 70.0

    def test_experience_score_empty(self, agent):
        assert agent._experience_score([]) == 0.0

    def test_education_score_masters(self, agent):
        edu = [{"degree": "M.S. Computer Science", "institution": "MIT"}]
        assert agent._education_score(edu) == 80.0

    def test_education_score_bachelors(self, agent):
        edu = [{"degree": "B.S. Computer Science", "institution": "MIT"}]
        assert agent._education_score(edu) == 70.0

    def test_education_score_empty(self, agent):
        assert agent._education_score([]) == 0.0

    def test_project_score_3_projects(self, agent):
        projs = [{"name": "P1"}, {"name": "P2"}, {"name": "P3"}]
        assert agent._project_score(projs) == 70.0

    def test_project_score_empty(self, agent):
        assert agent._project_score([]) == 0.0

    def test_hybrid_merge_weights(self, agent):
        ai = {"overall_score": 80, "technical_score": 75, "experience_score": 70,
              "skill_match_score": 80, "education_score": 65, "project_score": 70,
              "culture_fit_score": 60, "confidence_score": 85,
              "missing_skills": [], "strengths": ["✓ Python"], "weaknesses": [],
              "risks": [], "recommendation": "Recommend", "explanation": "Good match"}
        rule = {"overall_score": 70, "technical_score": 60, "experience_score": 65,
                "skill_match_score": 60, "education_score": 70, "project_score": 55,
                "culture_fit_score": 50, "confidence_score": 70}

        merged = agent._hybrid_merge(ai, rule)

        assert merged["overall_score"] == 76.0  # 0.6*80 + 0.4*70 = 76
        assert merged["technical_score"] == 69.0  # 0.6*75 + 0.4*60 = 69
        assert merged["strengths"] == ["✓ Python"]
        assert merged["recommendation"] == "Recommend"

    def test_rule_based_scoring_produces_8_scores(self, agent, sample_profile):
        job_description = "We need a Python backend engineer with FastAPI experience"
        result = agent._rule_based_scoring(sample_profile, job_description)

        assert "overall_score" in result
        assert "technical_score" in result
        assert "experience_score" in result
        assert "skill_match_score" in result
        assert "education_score" in result
        assert "project_score" in result
        assert "culture_fit_score" in result
        assert "confidence_score" in result

        for key in result:
            assert 0.0 <= result[key] <= 100.0, f"{key} out of range: {result[key]}"

    def test_parse_years(self, agent):
        assert agent._parse_years("3 years") == 3.0
        assert agent._parse_years("2 years 6 months") == 2.5
        assert agent._parse_years("1 yr") == 1.0
        assert agent._parse_years("") == 0.0
        assert agent._parse_years("6 months") == 0.5


@pytest.mark.asyncio
@patch("app.services.combined_analysis_agent.CombinedAnalysisAgent._call_ai_combined")
async def test_combined_analysis_returns_8_scores(mock_ai_call, sample_profile):
    from app.services.combined_analysis_agent import CombinedAnalysisAgent

    mock_ai_call.return_value = {
        "overall_score": 82, "technical_score": 78, "experience_score": 75,
        "skill_match_score": 85, "education_score": 70, "project_score": 72,
        "culture_fit_score": 65, "confidence_score": 80,
        "missing_skills": ["Kubernetes"], "strengths": ["✓ Python expertise"],
        "weaknesses": ["✗ No management experience"],
        "risks": ["Job hopping"], "recommendation": "Recommend",
        "explanation": "Strong technical match."
    }

    mock_db = AsyncMock()
    mock_repo = AsyncMock()
    mock_repo.get_profile.return_value = sample_profile
    mock_repo.upsert_candidate_score = AsyncMock(
        side_effect=lambda s: s
    )
    mock_repo.update_profile = AsyncMock(return_value=sample_profile)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    async def execute_side(*args, **kwargs):
        return mock_result

    mock_db.execute = execute_side

    agent = CombinedAnalysisAgent.__new__(CombinedAnalysisAgent)
    agent.ai = MagicMock()
    agent.repo = mock_repo
    agent.db = mock_db
    agent.categorization = __import__("app.services.categorization_service", fromlist=["CategorizationService"]).CategorizationService()

    score = await agent.analyze(sample_profile.id, "job-1",
                                "We need a Python backend engineer")

    assert score is not None
    assert score.overall_score is not None
    assert 0 <= score.overall_score <= 100
    assert score.technical_score is not None
    assert 0 <= score.technical_score <= 100
    assert score.experience_score is not None
    assert score.skill_match_score is not None
    assert score.education_score is not None
    assert score.project_score is not None
    assert score.culture_fit_score is not None
    assert score.confidence_score is not None
    assert len(score.strengths) > 0
    assert score.ai_recommendation == "Recommend"

    score_keys = [
        "overall_score", "technical_score", "experience_score",
        "skill_match_score", "education_score", "project_score",
        "culture_fit_score", "confidence_score",
    ]
    for key in score_keys:
        val = getattr(score, key)
        assert val is not None, f"{key} is None"
        assert 0 <= val <= 100, f"{key} = {val}, out of range"

    mock_repo.update_profile.assert_any_call(
        "c1", {"overall_score": score.overall_score, "category": "good_match"}
    )


@pytest.mark.asyncio
@patch("app.services.combined_analysis_agent.CombinedAnalysisAgent._call_ai_combined")
async def test_candidate_scores_per_job(mock_ai_call, sample_profile):
    from app.services.combined_analysis_agent import CombinedAnalysisAgent
    from app.services.categorization_service import CategorizationService

    mock_db = AsyncMock()
    mock_repo = AsyncMock()
    mock_repo.get_profile.return_value = sample_profile
    mock_repo.upsert_candidate_score = AsyncMock(
        side_effect=lambda s: s
    )
    mock_repo.update_profile = AsyncMock(return_value=sample_profile)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    async def execute_side(*args, **kwargs):
        return mock_result

    mock_db.execute = execute_side

    agent = CombinedAnalysisAgent.__new__(CombinedAnalysisAgent)
    agent.ai = MagicMock()
    agent.repo = mock_repo
    agent.db = mock_db
    agent.categorization = CategorizationService()

    mock_ai_call.return_value = {
        "overall_score": 90, "technical_score": 88, "experience_score": 85,
        "skill_match_score": 92, "education_score": 80, "project_score": 85,
        "culture_fit_score": 75, "confidence_score": 90,
        "missing_skills": [], "strengths": ["✓ Strong Python", "✓ AWS"],
        "weaknesses": [], "risks": [], "recommendation": "Strongly Recommend",
        "explanation": "Excellent match for senior backend role."
    }

    score_backend = await agent.analyze(sample_profile.id, "job-1",
                                         "Senior Backend Engineer requiring Python, FastAPI, AWS")

    mock_ai_call.return_value = {
        "overall_score": 30, "technical_score": 25, "experience_score": 20,
        "skill_match_score": 20, "education_score": 50, "project_score": 30,
        "culture_fit_score": 40, "confidence_score": 85,
        "missing_skills": ["Figma", "UI/UX", "Design Systems"],
        "strengths": [], "weaknesses": ["✗ No frontend experience", "✗ No design skills"],
        "risks": [], "recommendation": "Do Not Recommend",
        "explanation": "Weak match for frontend designer role."
    }

    score_frontend = await agent.analyze(sample_profile.id, "job-2",
                                          "Frontend Designer requiring Figma, UI/UX, Design Systems")

    assert score_backend.overall_score != score_frontend.overall_score
    assert score_backend.skill_match_score > score_frontend.skill_match_score
    assert score_backend.ai_recommendation == "Strongly Recommend"
    assert score_frontend.ai_recommendation == "Do Not Recommend"

    assert len(score_backend.missing_skills or []) < len(score_frontend.missing_skills or [])


class TestScoreBreakdownV2Schema:
    def test_score_breakdown_v2_all_fields(self):
        from app.models.candidate_schemas import ScoreBreakdownV2

        scores = ScoreBreakdownV2(
            overall_score=85.0,
            technical_score=80.0,
            experience_score=75.0,
            skill_match_score=90.0,
            education_score=70.0,
            project_score=65.0,
            culture_fit_score=60.0,
            confidence_score=88.0,
        )
        assert scores.overall_score == 85.0
        assert scores.skill_match_score == 90.0
        assert scores.culture_fit_score == 60.0

    def test_score_breakdown_defaults_zero(self):
        from app.models.candidate_schemas import ScoreBreakdownV2

        scores = ScoreBreakdownV2()
        assert scores.overall_score == 0
        assert scores.technical_score == 0

    def test_analyze_response_v2_schema(self):
        from app.models.candidate_schemas import AnalyzeResponseV2

        resp = AnalyzeResponseV2(
            candidate_id="c1",
            job_id="j1",
            candidate_name="Alice",
            scores={
                "overall_score": 82.0,
                "technical_score": 78.0,
                "experience_score": 75.0,
                "skill_match_score": 85.0,
                "education_score": 70.0,
                "project_score": 72.0,
                "culture_fit_score": 65.0,
                "confidence_score": 80.0,
            },
            missing_skills=["Kubernetes"],
            strengths=["✓ Python"],
            weaknesses=["✗ No management"],
            risks=["Job hopping"],
            recommendation="Recommend",
            explanation="Strong technical match.",
            category=CandidateCategory.STRONG_MATCH,
        )
        assert resp.candidate_id == "c1"
        assert len(resp.scores.model_dump()) == 8
        assert resp.category == CandidateCategory.STRONG_MATCH
