import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.orm import (
    CandidateProfile, CandidateScore, CandidateDuplicate, ProcessingJob,
    Job, Interview, ProcessingStatus, CandidateCategory,
)


class TestDashboardMetricsSchema:
    def test_dashboard_metrics_all_fields(self):
        from app.models.candidate_schemas import DashboardMetrics

        dm = DashboardMetrics(
            total_resumes=100,
            processed_resumes=90,
            strong_matches=20,
            duplicate_candidates=5,
            average_match_score=72.5,
            category_distribution={"strong": 20, "good": 30},
            total_jobs=3,
            total_candidates=100,
            total_interviews=10,
            total_rejected=15,
            total_selected=25,
            avg_processing_time_seconds=45.2,
            top_skills=["Python", "React", "SQL"],
            funnel={"applications": 100, "shortlisted": 40, "interview": 10, "rejected": 15},
        )
        assert dm.total_resumes == 100
        assert dm.average_match_score == 72.5
        assert dm.total_jobs == 3
        assert dm.total_interviews == 10
        assert dm.total_rejected == 15
        assert dm.total_selected == 25
        assert dm.avg_processing_time_seconds == 45.2
        assert dm.top_skills == ["Python", "React", "SQL"]
        assert dm.funnel["applications"] == 100

    def test_dashboard_metrics_defaults_zero(self):
        from app.models.candidate_schemas import DashboardMetrics

        dm = DashboardMetrics()
        assert dm.total_jobs == 0
        assert dm.total_candidates == 0
        assert dm.total_interviews == 0
        assert dm.total_rejected == 0
        assert dm.total_selected == 0
        assert dm.avg_processing_time_seconds == 0
        assert dm.top_skills == []
        assert dm.funnel == {}

    def test_round_trip_via_model_validate(self):
        from app.models.candidate_schemas import DashboardMetrics

        data = {
            "total_resumes": 50,
            "processed_resumes": 48,
            "strong_matches": 10,
            "duplicate_candidates": 2,
            "average_match_score": 68.3,
            "category_distribution": {"strong_match": 10, "good_match": 15},
            "total_jobs": 5,
            "total_candidates": 50,
            "total_interviews": 8,
            "total_rejected": 12,
            "total_selected": 18,
            "avg_processing_time_seconds": 35.0,
            "top_skills": ["Python", "SQL"],
            "funnel": {"applications": 50, "shortlisted": 20, "interview": 8, "rejected": 12},
        }
        dm = DashboardMetrics(**data)
        for k, v in data.items():
            assert getattr(dm, k) == v


class TestDashboardAggregation:
    def test_funnel_logic(self):
        statuses = ["new", "shortlisted", "interview", "rejected", "new", "shortlisted", "rejected"]
        funnel = {
            "applications": len(statuses),
            "shortlisted": sum(1 for s in statuses if s == "shortlisted"),
            "interview": sum(1 for s in statuses if s == "interview"),
            "rejected": sum(1 for s in statuses if s == "rejected"),
        }
        assert funnel["applications"] == 7
        assert funnel["shortlisted"] == 2
        assert funnel["interview"] == 1
        assert funnel["rejected"] == 2

    def test_top_skills_ranking(self):
        all_skills = [
            ["Python", "SQL", "AWS"],
            ["Python", "React"],
            ["SQL", "Docker"],
            ["Python", "Kubernetes", "AWS"],
            ["React", "TypeScript"],
        ]
        counter: dict[str, int] = {}
        for skills in all_skills:
            for s in skills:
                counter[s] = counter.get(s, 0) + 1
        top = sorted(counter, key=counter.get, reverse=True)[:10]
        assert top[0] == "Python"
        assert top[1] in ("SQL", "AWS", "React")

    def test_selected_count(self):
        statuses = ["new", "shortlisted", "interview", "rejected", "shortlisted", "hold"]
        selected = sum(1 for s in statuses if s in ("shortlisted", "interview"))
        assert selected == 3
