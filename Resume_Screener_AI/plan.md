# AI Recruitment Operating System (MVP)
Version: 2.0 (Revised — incorporates code-level audit findings)
Goal: Build a professional AI-powered Recruitment Operating System that helps HR teams reduce resume screening time from hours to minutes while keeping humans responsible for all hiring decisions.

The MVP should be designed with a scalable architecture so future AI agents and HR modules can be added without major redesign.

====================================================
PRODUCT GOAL
====================================================

This is NOT an ATS (Applicant Tracking System).

This is NOT a Resume Parser.

This is an AI Recruitment Assistant that understands:

• Company
• Hiring Policies
• Job Description
• Candidate Resume
• Candidate Experience
• Candidate Skills

Then provides explainable candidate ranking.

The system must help HR make better decisions, not replace HR.

====================================================
USER ROLES
====================================================

1. Super Admin
2. Company Admin
3. HR Recruiter
4. Hiring Manager (Future)
5. Candidate (Future Portal)

For MVP only:

Super Admin
Company Admin
HR Recruiter

====================================================
ARCHITECTURE OVERVIEW
====================================================

Single-tenant-per-company with RBAC. All data scoped by company_id.

Infrastructure Required at Start:

• PostgreSQL (Neon) with pgvector extension — stores all data + embeddings
• Redis (Upstash) — Celery broker + result backend + rate limiter counters
• Uploads folder (local) — stores original resume files for download; cloud storage later

====================================================
AI ARCHITECTURE
====================================================

4 agents (merged from original 7 for speed + accuracy):

  1. Company Knowledge Agent
  2. Job Description Agent
  3. Resume Quality Agent
  4. Resume Parsing Agent

  Combined Analysis Agent (Merged: Matching + Scoring + Explanation)
  → One AI call produces: 8 scores + strengths + weaknesses + risks + missing skills + recommendation + human-readable explanation

How agents are scoped:
  - Knowledge Agent: runs ONCE per company setup
  - JD Agent: runs ONCE per job creation
  - Quality Agent: runs per resume (rule-based, no AI cost)
  - Parsing Agent: runs per resume (1 AI call)
  - Embedding Service: runs per resume (Gemini API, ~0.5s)
  - Combined Analysis Agent: runs per resume per job (1 AI call, replaces 3)

Total per resume: 2 AI calls + 1 embedding = ~8-10 seconds

Embedding Model: Gemini text-embedding-004 (768-dim) → pgvector HNSW index

LLM Provider: Groq (primary), Gemini (fallback) via OpenAI Agents SDK

====================================================
PROCESSING PIPELINE (Revised)
====================================================

HR uploads ZIP (100-1000 resumes)
    │
    ▼
Server extracts ZIP → validates file types → filters invalid
    │
    ▼
Celery batch task (10-20 resumes per task)
    │
    ▼
For EACH resume (parallel within batch):
  ┌─────────────────────────────────────────────┐
  │  1. Quality Check Agent (rule-based, ~0s)   │
  │    - Valid email? File readable? Empty?      │
  │    - 8 checks total                         │
  │    - FAIL → mark "quality_failed", skip      │
  ├─────────────────────────────────────────────┤
  │  2. Parsing Agent (1 AI call, ~3-5s)        │
  │    - Extract name, skills, experience, etc   │
  ├──────────────────┬──────────────────────────┤
  │  3. Embedding     │  4. Combined Analysis    │
  │    (Gemini API)  │    (1 AI call, ~5s)      │
  │    ~0.5s         │    - 8 scores            │
  │                  │    - Strengths/Weaknesses │
  │                  │    - Risks/Missing skills │
  │                  │    - Explanation text     │
  └──────────────────┴──────────────────────────┘
  Steps 3 and 4 run in parallel (independent)
    │
    ▼
pgvector upsert (embedding) + DB write (profile + scores)
    │
    ▼
Credit deducted + notification sent

====================================================
RATE LIMITING (Critical — Missing in original plan)
====================================================

A Redis-backed Rate-Limited AI Dispatcher wraps all AI API calls:

• Token bucket algorithm per API key
• Tracks usage per minute
• Automatic queue + delay when approaching limit
• Auto-retry with exponential backoff on 429
• Fallback: Groq → Gemini → fail gracefully

Without this: 1000 resumes × Groq rate limit (~30 req/min) = workers constantly hitting 429 errors.

====================================================
CELERY CONFIGURATION (Revised)
====================================================

• worker_concurrency: 4-8 (was 1 — this was blocking the entire pipeline)
• Task priority queues:
  - high: single resume re-analyze, interview scheduling
  - default: batch resume processing
  - low: analytics aggregation, cleanup jobs
• Task soft_time_limit: 120s per resume
• Task hard_time_limit: 150s
• Retry policy: exponential backoff, max 3 retries, only on transient errors (not 4xx)
• Result backend: Redis (stores task status for frontend polling)
• Dead letter queue: failed tasks logged for admin review

====================================================
FILE STORAGE (Local First, Cloud Later)
====================================================

Phase 1 (Now): Keep original resume files in uploads/{job_id}/
  - Do NOT delete after text extraction (current code deletes them — lines 101-102, 207-208 in bulk.py)
  - Store file path in candidate_profiles.resume_file_path
  - Serve download via /api/resumes/{id}/download

Phase 2 (Future): Migrate to Cloudflare R2 / S3
  - Add cloud_storage_url field
  - Background migration job copies files
  - Zero-downtime switch

====================================================
DATABASE DESIGN
====================================================

Tables to CREATE:

companies
  id, name, logo_url, industry, company_size, website
  country, city, timezone, default_language
  hr_email, contact_number, created_at, updated_at

departments
  id, company_id (FK), name, created_at

jobs
  id, company_id (FK), department_id (FK)
  title, employment_type, location, remote_type
  experience_required, salary_range, currency
  num_openings, application_deadline
  required_skills (JSON), preferred_skills (JSON)
  responsibilities (JSON), qualifications (JSON), benefits (JSON)
  status, created_by, created_at, updated_at

company_knowledge
  id, company_id (FK)
  mission, vision, culture, core_values
  work_environment, remote_policy, working_hours
  interview_process, interview_stages, hiring_policy
  required_documents, preferred_skills, communication_style
  interview_days (JSON), interview_time_slots (JSON)
  meeting_duration, timezone

email_templates
  id, company_id (FK)
  type (invitation/rejection/selection/general)
  subject, body, created_at, updated_at

uploaded_documents
  id, company_id (FK)
  filename, original_name, file_type
  extracted_text (TEXT)
  embedding vector(768) — pgvector
  created_at

interviews
  id, company_id (FK), job_id (FK), candidate_id (FK)
  date, time, timezone
  meeting_link, interviewer, interview_round
  status, notes, created_at

interview_slots
  id, company_id (FK)
  day_of_week, start_time, end_time, is_available

notifications
  id, company_id (FK), user_id (FK)
  type, title, message, read (BOOLEAN), created_at

activity_logs
  id, company_id (FK), user_id (FK)
  action, entity_type, entity_id, details (JSON), created_at

candidate_scores (NEW — normalized per job)
  id, candidate_id (FK), job_id (FK)
  overall_score, technical_score, experience_score
  skill_match_score, education_score, project_score
  culture_fit_score, confidence_score
  missing_skills (JSON), strengths (JSON), weaknesses (JSON)
  risks (JSON), ai_explanation (TEXT)
  created_at

Tables to MODIFY:

users — ADD company_id (FK), role (ENUM: super_admin/company_admin/hr_recruiter)

candidate_profiles — ADD:
  resume_file_path (TEXT) — path to original file
  portfolio_url, website_url, achievements (JSON), languages (JSON)
  ALTER embedding TYPE vector(768) (was JSON — unused)
  ADD pgvector HNSW index on embedding

Indexes (Critical for performance):
  candidate_profiles(company_id, overall_score DESC)
  candidate_profiles(company_id, status)
  candidate_scores(candidate_id, job_id) UNIQUE
  candidate_profiles.embedding — HNSW vector_cosine_ops
  jobs(company_id, created_at DESC)
  notifications(company_id, read, created_at DESC)

====================================================
MODULE 1: COMPANY ONBOARDING
====================================================

Company creates account.

Fields:
  Company Name, Logo, Industry, Company Size, Website
  Country, City, Timezone, Default Language
  HR Email, Contact Number

Registration flow:
  1. User signs up with email + password
  2. Prompted to create company profile
  3. Company created → user becomes Company Admin
  4. Optionally invite additional HR team members

====================================================
MODULE 2: COMPANY KNOWLEDGE
====================================================

Structured company knowledge (not just text).

Basic Information:
  Mission, Vision, Company Culture, Core Values
  Work Environment, Remote Policy, Working Hours

Hiring Information:
  Interview Process, Interview Stages, Hiring Policy
  Required Documents, Preferred Skills, Communication Style

Scheduling:
  Interview Days, Interview Time Slots, Meeting Duration, Timezone

Email Templates:
  Interview Invitation, Rejection, Selection, General Communication

====================================================
DOCUMENT UPLOAD
====================================================

HR can upload PDF / DOCX / TXT documents:
  Employee Handbook, Hiring Guidelines, Engineering Standards
  Coding Standards, Company Policies, Culture Documents, Benefits Documents

The Knowledge Agent reads all documents → extracts structured knowledge → generates embeddings → stores in pgvector.

====================================================
AI COMPANY KNOWLEDGE AGENT
====================================================

Runs ONCE when company knowledge is saved/updated.

Pipeline:
  Read all uploaded documents → extract text
  Structured field extraction (mission, vision, culture, etc.)
  Generate embedding for each document (Gemini text-embedding-004)
  Store in uploaded_documents.embedding (vector(768))
  Store structured fields in company_knowledge table

====================================================
MODULE 3: JOB MANAGEMENT
====================================================

HR creates a new job.

Fields:
  Job Title, Department, Employment Type, Location
  Remote/Hybrid/Onsite, Experience Required, Salary Range
  Currency, Number of Openings, Application Deadline
  Required Skills, Preferred Skills, Responsibilities
  Qualifications, Benefits

====================================================
AI JOB DESCRIPTION AGENT
====================================================

Runs ONCE when HR creates/edits a job.

Checks:
  Missing skills, Grammar, Duplicate requirements
  Unrealistic requirements, Inclusive language
  Missing responsibilities, Missing qualifications

Suggests improvements, creates structured job description.

HR approves final version.

====================================================
MODULE 4: RESUME UPLOAD
====================================================

HR uploads ZIP file containing 100-200-500-1000 resumes.

Supported: PDF, DOCX, PNG, JPG, TXT inside ZIP

Processing:
  Server-side ZIP extraction
  File type validation
  Credit check before processing
  One Celery batch task per 10-20 resumes (reduces overhead 10-20x)
  Original files preserved in uploads/{job_id}/ for download

====================================================
MODULE 5: AI RESUME PROCESSING
====================================================

Pipeline (per resume, parallelized where possible):

Quality Check Agent (rule-based, no AI cost):
  Unreadable Resume, Duplicate Resume, Missing Email
  Broken Links, Incomplete Resume, Keyword Stuffing
  Empty Pages, Invalid Files

Parsing Agent (1 AI call):
  Name, Email, Phone, Location, LinkedIn, GitHub
  Portfolio, Website, Skills, Experience, Education
  Projects, Certifications, Languages, Achievements

Embedding Service (Gemini API):
  Generate 768-dim embedding vector
  Store in candidate_profiles.embedding

Combined Analysis Agent (1 AI call, replaces 3 original agents):
  Overall Score, Technical Score, Experience Score
  Skill Match Score, Education Score, Project Score
  Culture Fit Score, Confidence Score
  Missing Skills, Strengths, Weaknesses, Risks
  AI Explanation (human-readable with ✓ and ✗ bullets)
  Recommendation

====================================================
RESUME QUALITY CHECKS (8 checks, detailed)
====================================================

Unreadable Resume  — OCR returned empty or gibberish
Duplicate Resume   — embedding similarity > 0.95 with existing profile
Missing Email      — no email field found in parsed result
Broken Links       — LinkedIn/GitHub/Portfolio URLs return 4xx (async HEAD check)
Incomplete Resume  — missing both skills AND experience AND education
Keyword Stuffing   — same skill repeated 5+ times in different forms
Empty Pages        — extracted text < 100 characters after trimming whitespace
Invalid Files      — corrupted PDF, empty DOCX, truncated file

Failed checks mark the candidate as quality_failed with a flag. HR sees the issue. Processing continues.

====================================================
MODULE 6: AI CANDIDATE MATCHING (Revised — Merged)
====================================================

Candidate is NOT compared only with Job Description.

The Combined Analysis Agent compares against:

  Company Knowledge
  + Hiring Policies
  + Company Culture
  + Job Description
  + Required Skills
  + Preferred Skills
  + Candidate Resume

Generates semantic understanding. NOT simple keyword matching.

====================================================
AI COMBINED ANALYSIS AGENT (Matching + Scoring + Explanation)
====================================================

One AI call produces everything:

Scores:
  Overall Score (0-100)
  Technical Score (0-100)
  Experience Score (0-100)
  Skill Match Score (0-100)
  Education Score (0-100)
  Project Score (0-100)
  Culture Fit Score (0-100)
  Confidence Score (0-100)

Missing Skills — list of skills from JD the candidate lacks

Strengths — list of ✓ items the candidate brings

Weaknesses — list of ✗ items where the candidate falls short

Potential Risks — concerns (e.g., "Changed jobs yearly", "No team lead experience")

AI Explanation — human-readable paragraph justifying the overall score

Recommendation — Strongly Recommend / Recommend / Consider / Do Not Recommend

====================================================
SCORING (Hybrid — AI + Rule-based)
====================================================

Final scores = weighted combination:

  60% AI score (semantic understanding)
  40% Rule-based score (deterministic, consistent)

Rule-based component ensures consistency across candidates:
  - Skill keyword matching against normalized skill DB
  - Years of experience calculation
  - Education level scoring
  - Certification matching

The weighted combination prevents AI hallucination while keeping semantic understanding.

====================================================
MODULE 7: CANDIDATE DASHBOARD
====================================================

Candidate Card:
  Profile Picture (optional), Name, Score, Experience
  Skills, Education, Projects, GitHub, LinkedIn, Portfolio
  Status (Pending/Shortlisted/Interview/Rejected/Hold/Future Opportunity/Need Review)
  AI Summary, Strengths, Weaknesses, Risk
  Resume Download button

Sorting:
  Highest Score, Lowest Score, Newest, Oldest, Experience

Search:
  Skills, Location, Experience, Education, Status, Score Range

Detail View:
  All scores with explanation per score
  Resume viewer (embedded)
  Notes section
  Status change
  Schedule Interview button

====================================================
MODULE 8: HR DECISION
====================================================

Status:
  Pending, Shortlisted, Interview, Rejected
  Hold, Future Opportunity, Need Review

HR can add notes (stored for future reference):
  Strong Backend, Weak Communication, Good Leadership
  Salary Too High, Immediate Joiner

====================================================
MODULE 9: INTERVIEW SCHEDULING
====================================================

HR clicks "Schedule Interview" → automatically:
  1. Show available slots (from company interview_slots)
  2. HR picks date/time
  3. Generate Google Meet link
  4. Generate .ics calendar invite
  5. Generate professional email (from company email_templates)
  6. Send email to candidate
  7. Store interview record
  8. Schedule reminders (24h + 1h before)

Fields:
  Date, Time, Timezone, Meeting Link
  Interviewer, Interview Round

Reminders:
  24 Hours Before (email + notification)
  1 Hour Before (email + notification)

====================================================
MODULE 10: NOTIFICATIONS
====================================================

HR Notifications:
  Resume Processing Completed
  Interview Scheduled
  Candidate Status Updated
  System Errors

Stored in notifications table. Displayed as notification bell in UI.

====================================================
MODULE 11: ANALYTICS
====================================================

Dashboard:
  Total Jobs, Total Candidates, Total Interviews
  Total Rejected, Total Selected
  Average Resume Score, Average Processing Time
  Most Common Skills
  Candidate Funnel: Applications → Shortlisted → Interview → Rejected

====================================================
NON-FUNCTIONAL REQUIREMENTS
====================================================

• Modern responsive UI
• Dark mode
• Mobile responsive
• Secure authentication (bcrypt passwords)
• RBAC (Role Based Access Control) — company-level data isolation
• Async processing with progress indicators
• Error logging with correlation IDs
• File upload validation (type, size, virus scan optional)
• Scalable architecture (rate-limited AI, batched tasks, parallel pipelines)
• Modular backend (agents are swappable)
• API-first design, RESTful APIs
• Clean folder structure

====================================================
TECH STACK
====================================================

Frontend:
  Next.js (current: 16.2.4), React (19.2.4), TypeScript
  Tailwind CSS v4, ShadCN UI (to be added)

Backend:
  FastAPI, Python 3.12+
  SQLAlchemy (async) — staying with this over SQLModel for stability; upgrade later
  Alembic for migrations

Database:
  PostgreSQL (Neon) with pgvector extension

AI:
  OpenAI Agents SDK (multi-agent architecture)
  Groq (primary LLM), Gemini (fallback LLM)
  Gemini text-embedding-004 (embeddings, 768-dim)

Background Jobs:
  Celery + Redis (Upstash)
  Celery Beat for scheduled tasks (reminders, cleanup)

Document Processing:
  PyPDF2 + Tesseract OCR (current — works)
  Docling (future upgrade for better PDF parsing)

File Storage:
  Local uploads/ folder (now) → Cloudflare R2 (future)

Email:
  emailjs

Calendar:
  Google Calendar API + Google Meet API

Deployment (future):
  Docker, Hostinger/VPS for MVP

====================================================
TEST-DRIVEN APPROACH (Per Phase)
====================================================

Every phase has pre-implementation tests. Phase is NOT complete until all tests pass.

Golden Resume Test Set:
  5-10 resumes with pre-computed expected scores (computed by domain experts).
  Pipeline must produce scores within ±5 of expected.

Phase 0 Tests:
  test_pgvector_extension() — vector extension is enabled and functional
  test_bcrypt_hash() — passwords are hashed with bcrypt, not SHA-256
  test_celery_task_retry() — tasks retry with backoff on transient errors
  test_redis_rate_limiter() — rate limiter correctly tracks and enforces limits

Phase 1 Tests:
  test_company_creation_scopes_user() — user gets company_id on registration
  test_hr_cannot_access_company_b_data() — tenant isolation enforced at DB level
  test_rbac_denies_wrong_role() — HR cannot access admin endpoints
  test_company_onboarding_all_fields() — all 13 fields saved correctly

Phase 2 Tests:
  test_gemini_embedding_dim_768() — embedding output is 768-dim vector
  test_pgvector_hnsw_index() — HNSW index exists and is used in queries
  test_knowledge_agent_extracts_fields() — all structured fields extracted from docs
  test_embedding_similarity_search() — cosine similarity returns relevant results

Phase 3 Tests:
  test_jd_agent_suggests_improvements() — AI finds missing skills, grammar issues
  test_job_creation_with_all_fields() — all job fields stored correctly
  test_job_creation_requires_approval() — flow works (HR submits → AI reviews → HR approves)

Phase 4 Tests:
  test_resume_quality_8_checks() — each quality check fires correctly on known-bad input
  test_batch_embedding() — embedding API called with correct batch parameters
  test_hybrid_scoring_vs_pure_ai() — hybrid matches expert judgment better than pure-AI
  test_golden_resume_scores() — all golden resumes score within ±5 of expected
  test_parallel_pipeline_speed() — 100 resumes processed in < 15 min
  test_explanation_has_bullets() — explanation contains ✓ and ✗ items
  test_original_file_preserved() — file exists on disk after processing

Phase 5 Tests:
  test_combined_analysis_8_scores() — all 8 scores present and in 0-100 range
  test_semantic_matching_vs_keyword() — semantic matching outperforms current keyword
  test_candidate_scores_per_job() — same candidate can have different scores for different jobs

Phase 6 Tests:
  test_google_meet_link_generated() — meeting URL is valid format
  test_ics_generation() — .ics file contains correct date/time/attendees
  test_reminder_scheduled() — Celery Beat task created for 24h and 1h before
  test_interview_email_sent() — email sent with correct template
  test_google_calendar_rate_limit() — rate-limited correctly

Phase 7 Tests:
  test_notification_on_processing_complete() — notification created after batch finishes
  test_notification_on_interview_scheduled() — notification created when interview created
  test_activity_log_audit() — all status changes logged

Phase 8 Tests:
  test_funnel_aggregation() — funnel counts match actual DB state
  test_analytics_cache_invalidated() — analytics refresh correctly

Phase 9 Tests:
  test_dark_mode_toggle() — CSS variables switch correctly
  test_mobile_viewport() — all pages render at 375px width
  test_resume_download() — file downloads with correct content-type

====================================================
MIGRATION PHASES (12 phases, ~40 days)
====================================================

PHASE 0: Foundation Infrastructure (2 days)
  Step 0.1 — Add pgvector extension to Neon
  Step 0.2 — Add bcrypt, switch password hashing
  Step 0.3 — Create Alembic migrations for all new tables
  Step 0.4 — Add OpenAI Agents SDK, google-genai to requirements
  Step 0.5 — Build Redis-based Rate Limiter Service
  Step 0.6 — Build Async AI Client (httpx-based, non-blocking)
  Step 0.7 — Build Gemini Embedding Service
  Step 0.8 — Set up pytest + pytest-asyncio + golden resume test set
  Step 0.9 — Reconfigure Celery (concurrency, priority queues, result backend)

PHASE 1: Multi-Tenant Company Architecture (4 days)
  Step 1.1 — Create companies table + ORM model
  Step 1.2 — Modify users: add company_id FK + role enum
  Step 1.3 — Create departments table
  Step 1.4 — Build Company Onboarding API (CRUD)
  Step 1.5 — Build Company Onboarding frontend (multi-step form)
  Step 1.6 — Create multi-tenant data isolation middleware
  Step 1.7 — Update all repositories to scope by company_id
  Step 1.8 — RBAC middleware: role-based endpoint access
  Step 1.9 — Tests: tenant isolation, RBAC enforcement

PHASE 2: Company Knowledge System (4 days)
  Step 2.1 — Create company_knowledge, email_templates, uploaded_documents tables
  Step 2.2 — Build Knowledge Agent (reads docs → extracts structured → pgvector)
  Step 2.3 — Build document upload API (store locally, extract text, embed)
  Step 2.4 — Knowledge CRUD API + frontend pages
  Step 2.5 — Email template CRUD API + frontend editor
  Step 2.6 — Tests: embedding dimension, HNSW index, knowledge extraction

PHASE 3: Job Management (3 days)
  Step 3.1 — Create jobs table
  Step 3.2 — Build JD Agent (review, suggest, approve)
  Step 3.3 — Job CRUD API
  Step 3.4 — Job creation frontend (with AI review panel)
  Step 3.5 — Job list + detail frontend
  Step 3.6 — Tests: JD agent suggestions, full job creation flow

PHASE 4: Enhanced Resume Processing (6 days)
  Step 4.1 — Stop deleting original files; store file paths in DB
  Step 4.2 — Add resume download endpoint
  Step 4.3 — Build Resume Quality Agent (8 checks, rule-based)
  Step 4.4 — Refactor Parsing Agent (use OpenAI Agents SDK)
  Step 4.5 — Build Gemini Embedding Service + pgvector integration
  Step 4.6 — Add embedding step to processing pipeline
  Step 4.7 — Build candidate_scores table + migration from profile-based scores
  Step 4.8 — Enhance parsing: add portfolio, website, languages, achievements
  Step 4.9 — Batch task processing (10-20 resumes per Celery task)
  Step 4.10 — Parallelize parsing + embedding in pipeline
  Step 4.11 — Tests: all 8 quality checks, golden resume scores, original file preserved

PHASE 5: Combined Analysis Agent (4 days)
  Step 5.1 — Build Combined Analysis Agent (1 AI call: matching + scoring + explanation)
  Step 5.2 — Include company knowledge + culture + hiring policies in context
  Step 5.3 — Build 8-score breakdown with hybrid (AI + rule-based) calculation
  Step 5.4 — Build explanation generator (✓ and ✗ bullets)
  Step 5.5 — Store results in candidate_scores table
  Step 5.6 — Update candidate_profiles with summary fields
  Step 5.7 — Update frontend to display 8 scores + explanation
  Step 5.8 — Tests: 8 scores in range, explanation format, semantic > keyword

PHASE 6: Interview Scheduling (5 days)
  Step 6.1 — Create interview_slots, interviews tables
  Step 6.2 — Google Calendar + Meet API integration
  Step 6.3 — emailjs integration for interview emails
  Step 6.4 — .ics calendar invite generation
  Step 6.5 — Slot management API
  Step 6.6 — Schedule/reschedule/cancel API
  Step 6.7 — Frontend: schedule button, slot picker, confirmation
  Step 6.8 — Celery Beat for reminders (24h + 1h)
  Step 6.9 — Tests: Meet link, .ics, reminder scheduling

PHASE 7: Notifications & Activity Logs (2 days)
  Step 7.1 — Create notifications, activity_logs tables
  Step 7.2 — Notification triggers in processing pipeline
  Step 7.3 — Activity logging middleware
  Step 7.4 — Frontend: notification bell, notification page
  Step 7.5 — Tests: notifications created on events, audit trail

PHASE 8: Analytics Dashboard (2 days)
  Step 8.1 — Analytics aggregation queries (funnel, avg scores, processing time, skills)
  Step 8.2 — Analytics API endpoint
  Step 8.3 — Update dashboard frontend with full analytics
  Step 8.4 — Tests: funnel matches actual data

PHASE 9: Duplicate Detection Enhancement (1 day)
  Step 9.1 — Add embedding-based duplicate detection (cosine similarity > 0.95)
  Step 9.2 — Keep existing exact-match detection as first pass
  Step 9.3 — Tests: near-duplicate resumes caught by embedding

PHASE 10: Error Handling & Observability (2 days)
  Step 10.1 — Structured logging with correlation IDs per resume
  Step 10.2 — Celery dead letter queue handler
  Step 10.3 — Graceful degradation for all agents (if AI down, queue + retry)
  Step 10.4 — Task monitoring page (admin only)
  Step 10.5 — Data cleanup Celery Beat task (old files, orphaned jobs)

PHASE 11: Frontend UI Polish (4 days)
  Step 11.1 — Install ShadCN UI components (button, card, dialog, input, select, table, badge, etc.)
  Step 11.2 — Replace raw Tailwind with ShadCN components
  Step 11.3 — Implement dark mode (CSS variables already defined)
  Step 11.4 — Mobile responsive audit
  Step 11.5 — Add profile picture support to candidate cards
  Step 11.6 — Enhanced sorting/search on candidate list
  Step 11.7 — Loading states, error states, empty states
  Step 11.8 — Tests: dark mode, mobile viewport, resume download

PHASE 12: Final Integration & Load Testing (2 days)
  Step 12.1 — End-to-end test: upload 200 resumes → verify processing
  Step 12.2 — Rate limiter load test: 100 concurrent AI calls
  Step 12.3 — Performance benchmark: 1000 resumes processing time
  Step 12.4 — Golden resume accuracy check
  Step 12.5 — Fix any integration issues

====================================================
SUCCESS METRICS (MVP)
====================================================

The MVP is successful if it can:

• Process 200+ resumes asynchronously without blocking the UI.
  → Target: 200 resumes in < 30 minutes (with 4 workers)

• Extract structured candidate information with high accuracy.
  → Target: Golden resumes score within ±5 of expert-judged scores

• Rank candidates using company knowledge and job requirements, NOT keyword matching alone.
  → Verified: embedding-based semantic matching included in pipeline

• Provide transparent, explainable AI reasoning for every score.
  → Verified: Combined Analysis Agent produces explanation with ✓ and ✗ for every score

• Allow HR to review, filter, and manage candidates efficiently.
  → Sorting, search, status management, notes, resume download all functional

• Schedule interviews with one click, generating Google Meet links, calendar invites, and professional emails automatically.
  → Verified: full flow from slot picker → Meet → .ics → email → notification → reminders

• Handle 1000 resumes in a single batch without crashing.
  → Target: < 2 hours total processing time, zero data loss

• Reject invalid/bad resumes automatically.
  → 8 quality checks flag issues; HR sees flagged items

• Prevent AI API abuse and handle rate limits gracefully.
  → Redis rate limiter prevents 429 errors; auto-queues and retries

• Reduce recruiter resume-screening time by at least 70-90% compared to manual review.

• Be modular so future AI agents and HR modules can be added without redesigning the core architecture.
  → Agents are swappable (OpenAI Agents SDK), data isolated by company, API-first design
