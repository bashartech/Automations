"""Locust load testing script for Resume Screener AI API.

Usage:
  pip install locust
  locust -f locustfile.py --host=http://localhost:8002
  # Open http://localhost:8089 in browser
"""

from locust import HttpUser, task, between, tag
import json
import random
import uuid

SAMPLE_RESUME = """Experienced software engineer with 5 years in full-stack development.
Skilled in React, TypeScript, Python, and cloud infrastructure (AWS).
Led a team of 4 engineers delivering a SaaS platform serving 50k users.
Strong background in CI/CD pipelines, Docker, and microservices architecture."""

SAMPLE_JD = """We are looking for a Senior Software Engineer with strong React and Python skills.
Must have 3+ years experience in full-stack development and cloud infrastructure.
Experience with TypeScript, AWS, and team leadership is highly valued."""


class ApiUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Register and login to get a token."""
        self.token = None
        self.user_id = None
        self.candidate_id = None
        self.batch_id = None
        self.client.headers["Content-Type"] = "application/json"

    @tag("auth")
    @task(3)
    def register_and_login(self):
        email = f"loadtest_{uuid.uuid4().hex[:8]}@test.com"
        payload = {"name": "Load Test User", "email": email, "password": "testpass123"}
        with self.client.post("/api/auth/register", json=payload, catch_response=True) as res:
            if res.status_code == 200:
                data = res.json()
                self.token = data["token"]
                self.client.headers["Authorization"] = f"Bearer {self.token}"
            elif res.status_code == 409:
                res.success()
            else:
                res.failure(f"Register failed: {res.status_code}")

    @tag("auth")
    @task(2)
    def login(self):
        payload = {"email": "admin@test.com", "password": "admin123"}
        with self.client.post("/api/auth/login", json=payload, catch_response=True) as res:
            if res.status_code == 200:
                data = res.json()
                self.token = data["token"]
                self.client.headers["Authorization"] = f"Bearer {self.token}"

    @tag("health")
    @task(5)
    def health_check(self):
        self.client.get("/api/health")

    @tag("dashboard")
    @task(2)
    def get_dashboard(self):
        if not self.token:
            return
        self.client.get("/api/dashboard/metrics")

    @tag("candidates")
    @task(3)
    def list_candidates(self):
        if not self.token:
            return
        self.client.get("/api/candidates/?limit=20")

    @tag("candidates")
    @task(1)
    def filter_candidates(self):
        if not self.token:
            return
        for cat in ["strong_match", "good_match", "reject"]:
            self.client.get(f"/api/candidates/?category={cat}&limit=10")

    @tag("candidates")
    @task(1)
    def search_candidates(self):
        if not self.token:
            return
        self.client.get("/api/candidates/?search=react&limit=10")

    @tag("analyze")
    @task(2)
    def match_resume(self):
        payload = {"resume_text": SAMPLE_RESUME, "job_description": SAMPLE_JD}
        self.client.post("/api/match", json=payload)

    @tag("analyze")
    @task(1)
    def extract_skills(self):
        payload = {"text": SAMPLE_RESUME}
        self.client.post("/api/extract-skills", json=payload)

    @tag("batches")
    @task(1)
    def list_batches(self):
        if not self.token:
            return
        self.client.get("/api/resumes/batches/")

    @tag("batches")
    @task(1)
    def get_batch_detail(self):
        if not self.token or not self.batch_id:
            return
        self.client.get(f"/api/resumes/batches/{self.batch_id}")

    @tag("credits")
    @task(1)
    def get_credit_packs(self):
        self.client.get("/api/credits/packs")

    @tag("credits")
    @task(1)
    def get_credit_balance(self):
        if not self.token:
            return
        self.client.get("/api/credits/balance")

    @tag("jobs")
    @task(1)
    def list_jobs(self):
        if not self.token:
            return
        self.client.get("/api/jobs/")

    @tag("search")
    @task(1)
    def semantic_search(self):
        if not self.token:
            return
        payload = {"query": "React developer with TypeScript experience"}
        self.client.post("/api/search/candidates", json=payload)

    @tag("weights")
    @task(1)
    def get_weights(self):
        if not self.token:
            return
        self.client.get("/api/candidates/weights")


class AnonymousUser(HttpUser):
    """Simulates unauthenticated users hitting public endpoints."""
    wait_time = between(0.5, 2)

    @tag("health")
    @task(10)
    def health_check(self):
        self.client.get("/api/health")

    @tag("pricing")
    @task(3)
    def get_pricing(self):
        self.client.get("/api/credits/packs")

    @tag("auth")
    @task(1)
    def login_attempt(self):
        payload = {"email": "test@test.com", "password": "wrongpass"}
        self.client.post("/api/auth/login", json=payload)


class BatchUploadUser(HttpUser):
    """Simulates heavy batch uploads (admin/scraper behavior)."""
    wait_time = between(5, 15)

    def on_start(self):
        email = f"batch_{uuid.uuid4().hex[:8]}@test.com"
        payload = {"name": "Batch User", "email": email, "password": "testpass123"}
        with self.client.post("/api/auth/register", json=payload, catch_response=True) as res:
            if res.status_code == 200:
                self.token = res.json()["token"]
                self.client.headers["Authorization"] = f"Bearer {self.token}"
            else:
                self.token = None

    @tag("bulk")
    @task(1)
    def get_bulk_status(self):
        if not self.token:
            return
        self.client.get("/api/resumes/batches/")

    @tag("dashboard")
    @task(1)
    def dashboard(self):
        if not self.token:
            return
        self.client.get("/api/dashboard/metrics")

    @tag("candidates")
    @task(2)
    def browse_candidates(self):
        if not self.token:
            return
        self.client.get("/api/candidates/?limit=50")
