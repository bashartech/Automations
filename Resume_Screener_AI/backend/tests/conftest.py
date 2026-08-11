import pytest
from app.config import get_settings


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
def sample_resume_text():
    return """John Doe
john.doe@email.com | +1-555-0123 | linkedin.com/in/johndoe
San Francisco, CA

SUMMARY
Senior Full-Stack Engineer with 8 years of experience building scalable web applications.

SKILLS
Python, JavaScript, TypeScript, React, Node.js, FastAPI, PostgreSQL, Docker, Kubernetes, AWS, Redis, GraphQL

EXPERIENCE
Senior Software Engineer | TechCorp | 2020-2024
- Led a team of 5 engineers building microservices architecture
- Reduced API latency by 40% through query optimization
- Implemented CI/CD pipeline reducing deployment time by 60%

Software Engineer | StartupXYZ | 2017-2020
- Built RESTful APIs serving 1M+ daily users
- Migrated monolith to microservices using Docker and Kubernetes

EDUCATION
M.S. Computer Science | Stanford University | 2017
B.S. Computer Science | UC Berkeley | 2015

CERTIFICATIONS
AWS Solutions Architect, Google Cloud Professional

PROJECTS
E-commerce Platform | React, Node.js, PostgreSQL | Built full-stack platform handling 10k+ daily transactions
"""


@pytest.fixture
def sample_job_description():
    return """Senior Backend Engineer

We are looking for a Senior Backend Engineer to join our growing team.

Required Skills:
- Python, FastAPI, PostgreSQL
- Docker, Kubernetes
- AWS or GCP
- 5+ years of backend development experience

Preferred Skills:
- GraphQL, Redis
- Microservices architecture
- CI/CD pipelines

Responsibilities:
- Design and implement scalable microservices
- Mentor junior engineers
- Participate in code reviews
"""
