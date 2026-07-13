# ROLE

You are a Senior Software Architect, Senior AI Engineer, Senior Backend Engineer, Senior Frontend Engineer, Product Designer, and QA Engineer.

Your task is to upgrade an existing Resume Screening SaaS application.

The current stack is:

Frontend:

* Next.js
* TypeScript

Backend:

* FastAPI
* Python

Database:

* neon PostgreSQL

AI:

* Generic LLM Provider (must be provider-agnostic)

Document Processing:

* OCR already exists

You must design and implement a production-quality architecture.

Do not use model-specific implementations.

The system must support any LLM provider.

Avoid cloud vendor lock-in.

Everything must run locally during development.

Use:

* PostgreSQL
* Redis
* Celery
* Qdrant 
* FastAPI
* Next.js

---

# PROJECT GOAL

Build an AI-powered Resume Intelligence Platform that allows HR teams to:

* Upload resumes
* Analyze resumes
* Rank candidates
* Categorize candidates
* Search candidates semantically
* Detect duplicate resumes
* Process hundreds or thousands of resumes efficiently

The platform should significantly reduce manual screening work.

---

# GENERAL DEVELOPMENT RULES

1. Use clean architecture.

2. Separate:

   * AI Layer
   * Service Layer
   * Repository Layer
   * API Layer

3. Use dependency injection where appropriate.

4. Use Pydantic models.

5. Use TypeScript types everywhere.

6. Use proper error handling.

7. Use structured logging.

8. Use async processing where possible.

9. Build reusable services.

10. Create modular architecture.

11. Document every module.

12. Create unit-test-ready code.

13. Avoid hardcoded values.

14. Use environment variables.

15. Make every feature scalable.

---

# FEATURE 1

CANDIDATE ANALYSIS ENGINE

Goal:

Analyze a resume against a job description.

Requirements:

* Compare candidate to job description.
* Generate structured analysis.
* Generate detailed reasoning.
* Produce strengths.
* Produce weaknesses.
* Produce missing requirements.
* Produce recommendation.

Backend Requirements:

Create:

services/
candidate_analysis_service.py

schemas/
candidate_analysis.py

repositories/
candidate_repository.py

API Endpoint:

POST

/api/candidates/analyze

Input:

{
"job_description": "",
"resume_id": ""
}

Output:

{
"candidate_name": "",
"overall_score": 0,
"scores": {},
"strengths": [],
"weaknesses": [],
"recommendation": "",
"summary": ""
}

Frontend:

Create analysis page.

Display:

* Overall score
* Score breakdown
* Strengths
* Weaknesses
* Recommendation

Use modern dashboard design.

---

# FEATURE 2

STRUCTURED RESUME EXTRACTION ENGINE

Goal:

Convert resume into structured candidate profile.

Requirements:

Extract:

* Personal information
* Skills
* Experience
* Education
* Certifications
* Projects
* Awards
* Publications

Create:

CandidateProfile model.

Store structured data in PostgreSQL.

Database Tables:

candidate_profiles

Fields:

id
resume_id
name
email
phone
linkedin
github
location
summary
skills
experience
education
certifications
projects
created_at

API:

POST

/api/resumes/extract

Workflow:

Resume Upload
→ OCR
→ Extraction
→ Save Profile

Frontend:

Candidate Profile page.

Display structured profile.

Allow editing extracted data.

---

# FEATURE 3

WEIGHTED SCORING ENGINE

Goal:

Create deterministic scoring.

Requirements:

Create configurable scoring system.

Default weights:

Skills = 40
Experience = 30
Education = 15
Certifications = 10
Projects = 5

Weights must be configurable in database.

Create:

scoring_service.py

Output:

{
"skills_score": 0,
"experience_score": 0,
"education_score": 0,
"certification_score": 0,
"project_score": 0,
"overall_score": 0
}

Frontend:

Create scoring visualization.

Show breakdown chart.

Show score calculation details.

---

# FEATURE 4

BULK RESUME PROCESSING

Goal:

Process hundreds or thousands of resumes.

Requirements:

Use:

Redis
Celery

Create Queue System.

Workflow:

Upload ZIP
→ Extract Files
→ Create Jobs
→ Queue Processing
→ OCR
→ Extraction
→ Analysis
→ Store Results

Create:

tasks/
resume_processing_task.py

jobs/
bulk_processing_job.py

Database:

processing_jobs

Fields:

id
status
total_files
processed_files
failed_files
started_at
completed_at

Frontend:

Bulk Upload Page

Show:

* Upload progress
* Processing progress
* Success count
* Failed count

Create live updates.

---

# FEATURE 5

CANDIDATE CATEGORIZATION

Goal:

Automatically categorize candidates.

Categories:

Strong Match
Good Match
Average Match
Weak Match
Reject

Requirements:

Automatic assignment.

Store category in database.

Create:

candidate_category_service.py

Database:

candidate_category

Display category badges.

Add filters:

* Strong Match
* Good Match
* Average Match
* Weak Match
* Reject

Dashboard Analytics:

Count candidates per category.

---

# FEATURE 6

DUPLICATE RESUME DETECTION

Goal:

Detect duplicate candidates.

Requirements:

Create Candidate Fingerprint System.

Fingerprint Sources:

* Email
* Phone
* LinkedIn
* Github

Create similarity detection.

Store embeddings.

Create duplicate detection service.

Output:

{
"similarity": 0,
"duplicate_status": "",
"matching_candidate_id": ""
}

Create duplicate review screen.

Allow HR to:

* Merge candidates
* Ignore duplicate
* Mark as different person

Database:

candidate_duplicates

---

# FEATURE 7

SEMANTIC SEARCH

Goal:

Allow recruiters to search candidates using natural language.

Examples:

"React developer with 3 years experience"

"Frontend engineer"

"Python backend developer"

Requirements:

Use:

Qdrant

Create vector storage service.

Create embedding generation service.

Create semantic search service.

Workflow:

Candidate Profile
→ Embedding
→ Qdrant

Search Query
→ Embedding
→ Qdrant Search
→ Ranked Results

API:

POST

/api/search/candidates

Input:

{
"query": ""
}

Output:

{
"results": []
}

Frontend:

Search Page

Features:

* Search bar
* Relevance score
* Candidate cards
* Advanced filters

---

# DASHBOARD

Create Executive Dashboard.

Metrics:

* Total Resumes
* Processed Resumes
* Strong Matches
* Duplicate Candidates
* Search Activity
* Average Match Score

Charts:

* Category Distribution
* Hiring Funnel
* Resume Volume

---

# DATABASE

Design complete PostgreSQL schema.

Create migrations.

Create indexes.

Optimize for large datasets.

---

# API DOCUMENTATION

Generate complete API documentation.

Document:

* Request
* Response
* Validation
* Errors

---

# TESTING

Create:

* Unit tests
* Service tests
* API tests

---

# DELIVERABLE

Generate:

1. Full architecture plan
2. Folder structure
3. Database schema
4. Backend implementation
5. Frontend implementation
6. API design
7. Redis/Celery integration
8. Qdrant integration
9. Migration files
10. Testing strategy
11. Step-by-step implementation plan

Before writing code, first provide the complete architecture and implementation roadmap. Then implement feature-by-feature in production-ready quality.
