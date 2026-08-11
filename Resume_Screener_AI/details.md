Plan.md vs Current Project — Complete Gap Analysis
1. HIGH-LEVEL GAP SUMMARY
Area	Current Status	Plan.md Requires
Company Model	❌ No company entity at all	Full company onboarding with 13 fields, logo, industry, timezone, etc.
User Roles (RBAC)	❌ Single flat user model	Super Admin, Company Admin, HR Recruiter, Hiring Manager
Job Management	❌ No Job table; JD is just text on ProcessingJob	Full Job CRUD: title, dept, type, location, salary, skills, qualifications, etc.
Company Knowledge	❌ None	Mission, vision, culture, values, hiring policy, interview process, email templates, documents
Company Documents	❌ None	Upload handbooks, policies, standards → AI reads and embeds
AI Agent Architecture	❌ Single AI service class	7 distinct agents: Knowledge, JD, Resume Parsing, Quality, Matching, Scoring, Explanation
Interview Scheduling	❌ None	Google Meet, Calendar invite, email, reminders
Email System	❌ None	Templates + send via emailjs
Notifications	❌ None	HR notifications for processing complete, interview scheduled, etc.
Analytics	⚠️ Basic dashboard	Full funnel: jobs, candidates, interviews, avg score, processing time, common skills
Vector Search	⚠️ Qdrant (broken)	pgvector, properly integrated into pipeline
AI Scoring	⚠️ Single overall score	8 scores: overall, technical, experience, skill match, education, project, culture fit, confidence
Explainable AI	⚠️ Strengths/weaknesses list	Every score must have human-readable reasoning with ✓ and ✗ bullets
Resume Quality Check	❌ None	8 quality checks: unreadable, duplicate, missing email, broken links, incomplete, keyword stuffing, empty pages, invalid files
Zip Extraction	❌ Backend doesn't handle ZIP; frontend sends files individually	Full server-side ZIP extraction (100-1000 resumes)
ShadCN UI	❌ Not used (raw Tailwind)	ShadCN UI components
Dark Mode	⚠️ CSS vars defined but not implemented	Responsive dark mode
Mobile Responsive	⚠️ Partial	Full mobile responsive
SQLModel	❌ Using SQLAlchemy ORM directly	Plan says SQLModel
Docling	❌ Using PyPDF2 + python-docx	Docling for document processing
OpenAI Agents SDK	❌ Using direct OpenAI SDK calls	Multi-agent architecture with OpenAI Agents SDK
Department model	❌ None	Departments table
Interview slots	❌ None	Available time slots per company
Activity logs	❌ None	Activity logging for audit
Password hashing	⚠️ SHA-256 (no salt)	Should use bcrypt/argon2
2. DETAILED GAP ANALYSIS BY MODULE
MODULE 1: Company Onboarding ❌ (NOTHING EXISTS)
Current: No company table, no company concept. User is a standalone entity.
Plan requires:
- companies table with: name, logo_url, industry, company_size, website, country, city, timezone, default_language, hr_email, contact_number
- Company registration flow separate from user registration
- Each user belongs to a company
- UI for company profile setup with all 13 fields
MODULE 2: Company Knowledge ❌ (NOTHING EXISTS)
Current: No company knowledge, no document upload, no AI agent for knowledge.
Plan requires:
- company_knowledge table with structured fields: mission, vision, culture, core_values, work_environment, remote_policy, working_hours
- company_hiring_info table: interview_process, interview_stages, hiring_policy, required_documents, preferred_skills, communication_style
- company_scheduling table: interview_days, interview_time_slots, meeting_duration, timezone
- company_email_templates table: invitation, rejection, selection, general templates
- uploaded_documents table: for handbooks, policies, standards PDF/DOCX/TXT
- AI Knowledge Agent that reads all documents into pgvector
MODULE 3: Job Management ❌ (NOTHING EXISTS)
Current: No Job model. "Job description" is a free-text field on ProcessingJob.
Plan requires:
- jobs table: title, department_id, employment_type, location, remote_type, experience_required, salary_range, currency, num_openings, application_deadline, required_skills (JSON), preferred_skills (JSON), responsibilities (JSON), qualifications (JSON), benefits (JSON)
- departments table: name, company_id
- Full CRUD UI for jobs
- AI JD Agent that reviews and improves JD before posting
- HR approval workflow for final JD
MODULE 4: Resume Upload ⚠️ (PARTIAL)
Current: Supports individual file upload and multi-file upload (not ZIP). Frontend handles file selection.
Plan requires:
- ZIP file upload containing 100-1000 resumes
- Server-side ZIP extraction
- process_resume_file dispatches per file
Gap: Current frontend sends files one-by-one via FormData. Plan expects ZIP upload to server with async extraction.
MODULE 5: Resume AI Processing ⚠️ (PARTIAL)
Current: Has OCR, text extraction, profile extraction, duplicate detection. Missing layout detection, section detection, skill normalization, quality checks.
Plan requires full pipeline:
OCR → Text Extraction → Layout Detection → Section Detection → Entity Extraction → Skill Normalization → Candidate Profile → Embedding → Database
Plus Resume Quality Check:
- Unreadable Resume ✓ (partial - error handling)
- Duplicate Resume ✓ (exists)
- Missing Email ❌ (not checked)
- Broken Links ❌ (not checked)
- Incomplete Resume ❌ (not checked)
- Keyword Stuffing ❌ (not checked)
- Empty Pages ❌ (not checked)
- Invalid Files ❌ (not checked)
MODULE 6: Candidate Matching ❌ (Not as specified)
Current: Single AI call that scores vs JD text. Does NOT consider company knowledge, culture, hiring policies.
Plan requires:
Candidate comparison done against: Company Knowledge + Hiring Policies + Company Culture + Job Description + Required Skills + Preferred Skills + Candidate Resume = Semantic understanding. NOT keyword matching.
MODULE 7: Candidate Dashboard ⚠️ (PARTIAL)
Current: Has list view with filters and detail view with scores.
Missing from plan:
- Profile picture support ❌
- Resume download ❌ (original file not stored)
- Sort by: Highest/Lowest Score, Newest/Oldest, Experience ❌
- Search by skills, location, experience, education, status, score range ❌
- AI Summary per candidate ❌
- Strengths/Weaknesses/Risk per candidate ❌ (on detail but not on list)
MODULE 8: HR Decision ⚠️ (PARTIAL)
Current: Has status (new/shortlisted/interviewed/hired/rejected) and notes.
Missing:
- Status options don't match plan: Pending, Shortlisted, Interview, Rejected, Hold, Future Opportunity, Need Review
- Hold status ❌
- Future Opportunity status ❌
- Need Review status ❌
MODULE 9: Interview Scheduling ❌ (NOTHING EXISTS)
Current: No interview functionality at all.
Plan requires:
- Schedule Interview button on candidate
- Available slot reservation
- Google Meet generation
- Calendar invite (.ics)
- Interview email (templated)
- Fields: Date, Time, Timezone, Meeting Link, Interviewer, Interview Round
- Automatic reminders: 24h before, 1h before
MODULE 10: Notifications ❌ (NOTHING EXISTS)
Current: No notification system.
Plan requires:
- HR notifications for: Resume Processing Completed, Interview Scheduled, Candidate Status Updated, System Errors
MODULE 11: Analytics ⚠️ (BASIC)
Current: 4 metrics + category distribution.
Plan requires:
Total Jobs, Total Candidates, Total Interviews, Total Rejected, Total Selected, Average Resume Score, Average Processing Time, Most Common Skills, Candidate Funnel (Applications → Shortlisted → Interview → Rejected)
3. ARCHITECTURE & TECH STACK GAPS
Current	Plan.md Requires	Change
Qdrant (broken, unused)	pgvector	Migrate to pgvector extension on same PostgreSQL
OpenAI SDK direct calls	OpenAI Agents SDK	Multi-agent orchestration
Raw Tailwind CSS	ShadCN UI	Component library
SQLAlchemy ORM	SQLModel	Modern ORM (compatible with SQLAlchemy)
PyPDF2 + python-docx	Docling	Better document AI processing
No email	emailjs	Email notifications
No calendar	Google Calendar API	Meet + Calendar
SHA-256 passwords	bcrypt/argon2	Better security
In-memory rate limiter	Redis-based rate limiter	Distributed rate limiting
4. DATABASE SCHEMA — Tables to ADD
These tables need to be created:
companies
├── id (UUID PK)
├── name, logo_url, industry, company_size, website
├── country, city, timezone, default_language
├── hr_email, contact_number
├── created_at, updated_at

departments
├── id (UUID PK), company_id (FK)
├── name, head_count, created_at

users (MODIFY - add company_id, role)
├── company_id (FK → companies)
├── role (ENUM: super_admin, company_admin, hr_recruiter, hiring_manager)

jobs
├── id (UUID PK), company_id (FK), department_id (FK)
├── title, employment_type, location, remote_type
├── experience_required, salary_range, currency
├── num_openings, application_deadline
├── required_skills (JSON), preferred_skills (JSON)
├── responsibilities (JSON), qualifications (JSON), benefits (JSON)
├── status, created_by, created_at, updated_at

company_knowledge
├── id (UUID PK), company_id (FK)
├── mission, vision, culture, core_values
├── work_environment, remote_policy, working_hours
├── interview_process, interview_stages, hiring_policy
├── required_documents, preferred_skills, communication_style
├── interview_days (JSON), interview_time_slots (JSON)
├── meeting_duration, timezone

email_templates
├── id (UUID PK), company_id (FK)
├── type (invitation/rejection/selection/general)
├── subject, body, created_at, updated_at

uploaded_documents
├── id (UUID PK), company_id (FK)
├── filename, original_name, file_type
├── extracted_text (TEXT)
├── embedding (vector - pgvector)
├── created_at

interviews
├── id (UUID PK), company_id (FK), job_id (FK), candidate_id (FK)
├── date, time, timezone
├── meeting_link, interviewer, interview_round
├── status, notes, created_at

notifications
├── id (UUID PK), company_id (FK), user_id (FK)
├── type, title, message, read (BOOLEAN)
├── created_at

activity_logs
├── id (UUID PK), company_id (FK), user_id (FK)
├── action, entity_type, entity_id, details (JSON)
├── created_at

candidate_profiles (MODIFY — add score breakdown fields)
├── technical_score, experience_score, skill_match_score
├── education_score, project_score, culture_fit_score
├── confidence_score, missing_skills (JSON)
├── strengths (JSON), weaknesses (JSON), risks (JSON)
├── ai_summary, portfolio_url, website_url

candidate_scores (NEW — normalized per job)
├── id, candidate_id (FK), job_id (FK)
├── overall_score, technical_score, experience_score
├── skill_match, education_score, project_score
├── culture_fit, confidence_score
├── missing_skills, strengths, weaknesses, risks
├── ai_explanation, created_at

interview_slots
├── id, company_id (FK)
├── day_of_week, start_time, end_time, is_available

calendar_events (optional-cache)
├── id, interview_id (FK)
├── google_event_id, ics_content, created_at
5. FRONTEND PAGES TO ADD / MODIFY
New Pages Needed:
/company/onboarding      — Company profile setup (13 fields)
/company/knowledge       — Company knowledge management
/company/documents       — Upload handbooks, policies
/company/settings        — Company settings
/jobs                    — Job listing
/jobs/new                — Create job with AI review
/jobs/[id]               — Job detail with candidates
/jobs/[id]/edit          — Edit job
/interviews              — Interview list
/interviews/schedule     — Schedule interview
/emails/templates        — Email template management
/notifications           — Notification center
/admin/users             — User management (Super Admin)
/admin/companies         — Company management (Super Admin)
Existing Pages to Modify:
/                        — Dashboard → full analytics with funnel
/candidates              — Add sorting, search, AI summary, resume download
/candidates/[id]         — Add profile picture, full score breakdown with explanations
/bulk                    — ZIP upload support
/batches                 — Minor updates
/pricing                 — Minor
/billing                 — Minor
/layout.tsx              — Add company context, admin navigation
New Components Needed:
CompanyOnboardingForm    — Multi-step company setup
JobForm                  — Job creation with AI review
InterviewScheduler       — Calendar picker, Google Meet integration
EmailTemplateEditor      — Rich text template editor
NotificationBell         — Dropdown notification center
CandidateFunnelChart     — Analytics funnel visualization
ScoreExplanationCard     — Explainable AI score display
ResumeQualityBadge       — Quality check results
FileDropzone             — Enhanced file upload for company docs
6. AI AGENTS TO BUILD (7 Agents)
Agent	Responsibility
Company Knowledge Agent	Reads company docs → extracts knowledge → generates embeddings → stores in pgvector
Job Description Agent	Reviews JD for completeness/inclusivity → suggests improvements → creates structured JD
Resume Parsing Agent	Extracts structured candidate info from resume text
Resume Quality Agent	Validates resume: unreadable, duplicate, missing email, broken links, incomplete, keyword stuffing, empty pages, invalid files
Candidate Matching Agent	Semantic matching: company knowledge + hiring policies + culture + JD + candidate → understanding
Scoring Agent	Calculates 8 scores with weighted dimensions
Explanation Agent	Generates human-readable reasoning for every score with ✓ and ✗ bullets
7. MIGRATION STEPS (ORDERED)
PHASE 0: Foundation Infrastructure
  Step 0.1 — Add pgvector extension to Neon database
  Step 0.2 — Add bcrypt dependency, switch password hashing
  Step 0.3 — Create alembic migrations for all new tables
  Step 0.4 — Add OpenAI Agents SDK to requirements

PHASE 1: Multi-Tenant Company Architecture
  Step 1.1 — Create `companies` table + ORM model
  Step 1.2 — Modify `users` table: add company_id FK + role enum
  Step 1.3 — Create `departments` table
  Step 1.4 — Build Company Onboarding API (CRUD)
  Step 1.5 — Build Company Onboarding frontend (multi-step form, 13 fields)
  Step 1.6 — Update all existing data access to scope by company
  Step 1.7 — Update auth: registration creates company, login returns company context
  Step 1.8 — RBAC middleware: role-based endpoint access

PHASE 2: Company Knowledge System
  Step 2.1 — Create `company_knowledge` table (all structured fields)
  Step 2.2 — Create `email_templates` table
  Step 2.3 — Create `uploaded_documents` table + file storage
  Step 2.4 — Build Company Knowledge Agent (reads docs → pgvector)
  Step 2.5 — API endpoints: knowledge CRUD, document upload, template CRUD
  Step 2.6 — Frontend: knowledge management page, document upload, template editor

PHASE 3: Job Management
  Step 3.1 — Create `jobs` table with all fields
  Step 3.2 — Build Job Agent (review JD, suggest improvements, approve)
  Step 3.3 — API: job CRUD, JD review, approval
  Step 3.4 — Frontend: job list, create with AI review, detail, edit

PHASE 4: Enhanced Resume Processing
  Step 4.1 — Add server-side ZIP extraction
  Step 4.2 — Build Resume Quality Agent (8 checks)
  Step 4.3 — Migrate Qdrant → pgvector for all vector operations
  Step 4.4 — Embedding generation in processing pipeline (every resume gets pgvector embedding)
  Step 4.5 — Update candidate_profiles with score breakdown fields
  Step 4.6 — Build `candidate_scores` table (normalized per job)
  Step 4.7 — Enhance Scoring Agent: 8 scores, weighted by company preferences
  Step 4.8 — Build Explanation Agent: human-readable reasoning for every score

PHASE 5: AI Matching Overhaul
  Step 5.1 — Refactor AI matching to include company knowledge + culture + hiring policies
  Step 5.2 — Semantic search via pgvector (replace Qdrant entirely)
  Step 5.3 — Update frontend candidate display with new scores and explanations

PHASE 6: Interview Scheduling
  Step 6.1 — Create `interview_slots`, `interviews`, `calendar_events` tables
  Step 6.2 — Google Calendar + Meet API integration
  Step 6.3 — emailjs integration for interview emails
  Step 6.4 — .ics calendar invite generation
  Step 6.5 — API: slot management, schedule, reschedule, cancel
  Step 6.6 — Frontend: schedule button, calendar picker, confirmation
  Step 6.7 — Reminder system: 24h + 1h before (Celery beat)

PHASE 7: Notifications & Activity Logs
  Step 7.1 — Create `notifications` table
  Step 7.2 — Create `activity_logs` table
  Step 7.3 — Notification triggers in processing pipeline
  Step 7.4 — Frontend: notification bell, notification page

PHASE 8: Analytics Dashboard
  Step 8.1 — Add analytics endpoints (funnel, avg scores, processing time, common skills)
  Step 8.2 — Update dashboard with full analytics

PHASE 9: UI Polish
  Step 9.1 — Install ShadCN UI components
  Step 9.2 — Replace raw Tailwind with ShadCN components
  Step 9.3 — Implement dark mode
  Step 9.4 — Full mobile responsive audit
  Step 9.5 — Add profile picture upload for candidates
  Step 9.6 — Resume download from stored files
  Step 9.7 — Enhanced sorting/search on candidate list
8. KEY API KEYS YOU'LL NEED TO ADD
Based on plan.md requirements, beyond what you already have:
Service	Purpose
Groq	Primary AI inference
Gemini	Fallback AI inference
OpenAI	Embeddings (text-embedding-ada-002)
Stripe	Payment processing
Neon	PostgreSQL + pgvector
Redis/Upstash	Celery broker
Qdrant	Will be replaced by pgvector
Google OAuth	Calendar + Meet API
Google Calendar API	Calendar events, Meet links
Google Gmail API	Email sending (optional)
emailjs	Email templates + sending
9. WORKFLOW: COMPANY ONBOARDING → LAST STEP
AS-IS (Current workflow):
1. User registers → gets 20 free credits
2. Goes to dashboard → sees empty metrics
3. Goes to Bulk Upload → uploads resumes with JD text
4. Waits for Celery to process → sees candidates
5. Reviews candidates → changes statuses → exports CSV
6. Can re-analyze with new JD → pays credits per analysis
TO-BE (After migration):
 1. Company Registration: New user creates account → prompted to create company profile (13 fields: name, logo, industry, size, website, country, city, timezone, language, email, phone)
 2. Company Knowledge Setup: HR fills in mission, vision, culture, values, work environment, remote policy, interview process, hiring policy, communication style. Can upload handbooks/policies (PDF/DOCX). AI Knowledge Agent reads everything → extracts insights → stores in pgvector.
 3. Email Template Setup: HR configures email templates for interview invitations, rejections, selections.
 4. Interview Configuration: Sets available interview days, time slots, duration, timezone.
 5. Job Creation: HR creates a job with all fields (title, department, type, location, salary, skills, responsibilities, etc.). AI JD Agent reviews the JD → suggests improvements for missing skills, grammar, inclusive language → HR approves.
 6. Resume Upload: HR uploads ZIP with 100-1000 resumes (or individual files). System extracts ZIP server-side, creates tasks per resume, processes asynchronously via Celery.
 7. AI Processing Pipeline: For each resume: OCR → text extraction → quality check (8 checks) → entity extraction → skill normalization → profile generation → embedding generation (pgvector) → database storage. Quality issues flagged for HR review.
 8. AI Matching: Each candidate matched against: Company Knowledge + Hiring Policy + Culture + Job Description + Required Skills + Preferred Skills → semantic understanding (not keyword matching) → 8-dimension scoring.
 9. Explainable Scores: Every score has human-readable reasoning. Example: "92% — ✓ 6 years Python, ✓ FastAPI, ✓ Docker... Missing: ✗ AWS, ✗ Redis. Risk: Changed jobs yearly."
10. HR Review Dashboard: Candidates ranked by score. HR can filter, search, sort by all dimensions. Each card shows: name, score, experience, skills, education, AI summary, strengths, weaknesses, risks. Resume downloadable.
11. Decision Workflow: HR sets status: Pending → Shortlisted → Interview → Rejected → Hold → Future Opportunity → Need Review. HR adds notes.
12. Interview Scheduling: HR clicks "Schedule Interview" → selects available slot → system generates Google Meet link, .ics calendar invite, professional email → sends to candidate automatically.
13. Reminders: Automatic 24h and 1h email reminders before interview.
14. Notifications: HR gets notified: processing complete, interview scheduled, candidate status updated.
15. Analytics: Real-time dashboard showing total jobs, candidates, interviews, rejected/selected, average score, processing time, most common skills, candidate funnel.
10. ESTIMATED EFFORT
Phase	Files Changed	New Files
Phase 0: Foundation	5	2
Phase 1: Company + RBAC	15	8
Phase 2: Knowledge System	12	10
Phase 3: Job Management	10	8
Phase 4: Enhanced Processing	15	7
Phase 5: AI Matching Overhaul	8	4
Phase 6: Interview Scheduling	12	10
Phase 7: Notifications	8	5
Phase 8: Analytics	4	2
Phase 9: UI Polish	20	5
TOTAL	~109 files	~61 new files
11. TECHNICAL DECISIONS
Database: Stick with Neon PostgreSQL + pgvector
- Current: NEON_DATABASE_URL is already set up
- Add CREATE EXTENSION vector; to enable pgvector
- Embeddings stored as vector(1536) column (OpenAI Ada-002)
- Remove Qdrant entirely — simplifies architecture
AI: Multi-Agent via OpenAI Agents SDK
- Install openai-agents Python SDK
- Each agent is a separate class with specific tools/responsibilities
- Agents can hand-off to each other (e.g., Matching Agent calls Scoring Agent)
- Groq as the LLM provider (already configured), with Gemini fallback
File Storage: Keep DB + add cloud option
- Current: Extract text, store in DB, delete file
- Add: Store original file to cloud storage (S3-compatible) for later download
- Profile pictures: URL-based, store in cloud
Email: emailjs + Google Calendar API
- emailjs for sending templated emails
- Google Calendar API for Meet links and .ics generation
- Celery Beat for scheduled reminders



- the departments i added in the onboarding page is not showing in the settings page department section
- duplicate shows 58 even i only upload 4 resumes
- no loader in the department section because it takes time and look nothing happen when i click add
- compare candidate not shows any loading when starting to create report
- add feature that when we create job and fill form so ai tell the mistake so -> ai also create updated job description also in job discription section so we can select that ai job description add it and change if we want 
- when i create a job so  why 2 jobs created with same info and it shows draft why when i create job
- when i click on analyze all candidates against this jd so it shows all candidate with no score -> INFO:     127.0.0.1:54644 - "OPTIONS /api/candidates/analyze HTTP/1.1" 200 OK
INFO:     127.0.0.1:54644 - "POST /api/candidates/analyze HTTP/1.1" 500 Internal Server Error
INFO:     127.0.0.1:54644 - "POST /api/candidates/analyze HTTP/1.1" 500 Internal Server Error
INFO:     127.0.0.1:54644 - "POST /api/candidates/analyze HTTP/1.1" 500 Internal Server Error