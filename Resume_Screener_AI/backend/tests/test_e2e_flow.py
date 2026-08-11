"""End-to-end integration tests for Resume Screener AI API.

These tests run against a LIVE server. Start the server first:
  cd backend && uvicorn app.main:app --port 8002

Run:
  cd backend && pytest tests/test_e2e_flow.py -v --base-url=http://localhost:8002
"""

import pytest
import httpx
import uuid

BASE_URL = "http://localhost:8002"

SAMPLE_RESUME = """Experienced software engineer with 5 years in full-stack development.
Skilled in React, TypeScript, Python, AWS, Docker, and CI/CD.
Led a team of 4 engineers delivering a SaaS platform serving 50k users.
Bachelor's in Computer Science from MIT."""

SAMPLE_JD = """We are looking for a Senior Software Engineer with strong React and Python skills.
Must have 3+ years experience in full-stack development and cloud infrastructure.
Experience with TypeScript, AWS, and team leadership is highly valued."""


@pytest.fixture(scope="session")
def client():
    return httpx.Client(base_url=BASE_URL, timeout=30)


@pytest.fixture(scope="module")
def auth_token(client):
    email = f"e2e_{uuid.uuid4().hex[:8]}@test.com"
    res = client.post("/api/auth/register", json={
        "name": "E2E User", "email": email, "password": "testpass123",
    })
    assert res.status_code == 200, f"Register failed: {res.text}"
    token = res.json()["token"]
    return token


@pytest.fixture(scope="module")
def authed_client(client, auth_token):
    client.headers["Authorization"] = f"Bearer {auth_token}"
    return client


class TestHealth:
    def test_health_check(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

    def test_root(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert "Resume Screener AI API" in res.json()["message"]


class TestAuthFlow:
    def test_register_and_login(self, client):
        email = f"authflow_{uuid.uuid4().hex[:8]}@test.com"
        res = client.post("/api/auth/register", json={
            "name": "Auth Flow User", "email": email, "password": "testpass123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["email"] == email

        res = client.post("/api/auth/login", json={
            "email": email, "password": "testpass123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data

    def test_register_duplicate(self, client):
        email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/api/auth/register", json={
            "name": "Dup", "email": email, "password": "testpass123",
        })
        res = client.post("/api/auth/register", json={
            "name": "Dup", "email": email, "password": "testpass123",
        })
        assert res.status_code == 409

    def test_me_endpoint(self, authed_client):
        res = authed_client.get("/api/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert "email" in data
        assert "name" in data


class TestAnalyzeFlow:
    def test_extract_skills(self, authed_client):
        res = authed_client.post("/api/extract-skills", json={"text": SAMPLE_RESUME})
        assert res.status_code == 200
        data = res.json()
        assert "skills" in data
        assert len(data["skills"]) > 0
        assert any("react" in s.lower() for s in data["skills"])

    def test_match_resume(self, client):
        res = client.post("/api/match", json={
            "resume_text": SAMPLE_RESUME,
            "job_description": SAMPLE_JD,
        })
        assert res.status_code == 200
        data = res.json()
        assert "match_percentage" in data
        assert "matched_skills" in data
        assert "summary" in data
        assert 0 <= data["match_percentage"] <= 100

    def test_extract_and_analyze_profile(self, authed_client):
        res = authed_client.post("/api/candidates/extract", json={"text": SAMPLE_RESUME})
        assert res.status_code == 200
        data = res.json()
        assert "profile" in data
        profile = data["profile"]
        assert "id" in profile
        assert profile["name"] is not None

        analyze_res = authed_client.post("/api/candidates/analyze", json={
            "resume_id": profile["id"],
            "job_description": SAMPLE_JD,
        })
        assert analyze_res.status_code == 200
        analysis = analyze_res.json()
        assert "overall_score" in analysis
        assert "scores" in analysis
        assert "category" in analysis
        assert 0 <= analysis["overall_score"] <= 100


class TestCandidateFlow:
    def test_list_candidates(self, authed_client):
        res = authed_client.get("/api/candidates/?limit=10")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        if data:
            c = data[0]
            assert "id" in c
            assert "name" in c

    def test_filter_by_category(self, authed_client):
        res = authed_client.get("/api/candidates/?category=strong_match&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_search_candidates(self, authed_client):
        res = authed_client.get("/api/candidates/?search=react&limit=10")
        assert res.status_code == 200

    def test_update_candidate(self, authed_client):
        res = authed_client.get("/api/candidates/?limit=1")
        if not res.json():
            pytest.skip("No candidates to update")
        cid = res.json()[0]["id"]
        res = authed_client.patch(f"/api/candidates/{cid}", json={"status": "shortlisted"})
        assert res.status_code == 200
        assert res.json()["status"] == "shortlisted"


class TestSemanticSearch:
    def test_semantic_search(self, authed_client):
        res = authed_client.post("/api/search/candidates", json={
            "query": "React developer with TypeScript experience",
        })
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert isinstance(data["results"], list)


class TestDashboard:
    def test_dashboard_metrics(self, authed_client):
        res = authed_client.get("/api/dashboard/metrics")
        assert res.status_code == 200
        data = res.json()
        assert "total_candidates" in data
        assert "processed_resumes" in data
        assert isinstance(data["category_distribution"], dict)
        assert isinstance(data["top_skills"], list)


class TestBatchFlow:
    def test_list_batches(self, authed_client):
        res = authed_client.get("/api/resumes/batches/")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_batch_from_text(self, authed_client):
        res = authed_client.get("/api/resumes/batches/")
        before = len(res.json())
        id1 = uuid.uuid4().hex
        id2 = uuid.uuid4().hex
        payload = {
            "files": [
                {"name": f"{id1}_resume_1.pdf", "text": SAMPLE_RESUME},
                {"name": f"{id2}_resume_2.pdf", "text": SAMPLE_RESUME},
            ],
            "job_description": SAMPLE_JD,
        }
        res = authed_client.post("/api/resumes/bulk-upload-text", json=payload)
        if res.status_code == 404:
            pytest.skip("bulk-upload-text endpoint not available")
        assert res.status_code in (200, 201)
        data = res.json()
        assert "job_id" in data


class TestCreditFlow:
    def test_credit_packs(self, client):
        res = client.get("/api/credits/packs")
        assert res.status_code == 200
        packs = res.json()
        assert len(packs) > 0
        free = [p for p in packs if p["price_cents"] == 0]
        assert len(free) >= 1

    def test_credit_balance(self, authed_client):
        res = authed_client.get("/api/credits/balance")
        assert res.status_code == 200
        assert "credits_remaining" in res.json()

    def test_credit_history(self, authed_client):
        res = authed_client.get("/api/credits/history")
        assert res.status_code == 200
        assert isinstance(res.json(), list)


class TestWeightsFlow:
    def test_get_weights(self, authed_client):
        res = authed_client.get("/api/candidates/weights")
        assert res.status_code == 200
        data = res.json()
        assert "skill_weight" in data
        assert "experience_weight" in data
        assert "education_weight" in data
        assert "certification_weight" in data
        assert "project_weight" in data

    def test_update_weights(self, authed_client):
        res = authed_client.put("/api/candidates/weights", json={"skill_weight": 35})
        assert res.status_code == 200
        assert res.json()["skill_weight"] == 35


class TestBillingFlow:
    def test_get_credit_packs(self, client):
        res = client.get("/api/credits/packs")
        assert res.status_code == 200
        data = res.json()
        assert len(data) > 0
        assert all("id" in p and "name" in p and "credits" in p for p in data)

    def test_create_checkout_mock(self, authed_client):
        res = authed_client.get("/api/credits/packs")
        if not res.json():
            pytest.skip("No credit packs")
        pack_id = res.json()[0]["id"]
        res = authed_client.post("/api/credits/create-checkout", json={"pack_id": pack_id})
        assert res.status_code == 200
        data = res.json()
        assert "success" in data
        assert "credits_added" in data


class TestJobFlow:
    def test_create_and_list_jobs(self, authed_client):
        res = authed_client.post("/api/jobs/", json={
            "title": "E2E Test Engineer",
            "description": SAMPLE_JD,
            "department": "Engineering",
            "location": "Remote",
            "employment_type": "full-time",
            "experience_level": "senior",
            "salary_min": 100000,
            "salary_max": 150000,
            "currency": "USD",
            "requirements": ["React", "Python", "AWS"],
            "benefits": ["Health Insurance", "Remote Work"],
        })
        assert res.status_code in (200, 201), f"Job create failed: {res.text}"
        job = res.json()
        assert job["title"] == "E2E Test Engineer"
        assert "id" in job

        res = authed_client.get("/api/jobs/")
        assert res.status_code == 200
        assert len(res.json()) >= 1


class TestAdminFlow:
    def test_failed_tasks(self, authed_client):
        res = authed_client.get("/api/admin/failed-tasks")
        assert res.status_code in (200, 403)
        if res.status_code == 200:
            assert isinstance(res.json(), list)

    def test_task_logs(self, authed_client):
        res = authed_client.get("/api/admin/task-logs")
        assert res.status_code in (200, 403)
        if res.status_code == 200:
            assert isinstance(res.json(), list)


class TestResumeDownloadFlow:
    def test_download_resume(self, authed_client):
        res = authed_client.get("/api/candidates/?limit=1")
        if not res.json():
            pytest.skip("No candidates to test download")
        cid = res.json()[0]["id"]
        res = authed_client.get(f"/api/candidates/{cid}/download")
        if res.status_code == 404:
            # Either no file path or file missing on disk — both acceptable
            detail = res.json().get("detail", "")
            assert "No resume file" in detail or "not found on disk" in detail
        else:
            assert res.status_code == 200
            assert "content-type" in res.headers
