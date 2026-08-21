# Resume Screener AI

**AI-powered batch resume screening and candidate ranking platform** — upload resumes in bulk, extract structured profiles via LLM, score and rank candidates against job descriptions, detect duplicates, and manage the full hiring workflow with multi-tenant auth, credits, payments, and interview scheduling.

Built on **Next.js + FastAPI + Celery**, deployed on **AWS ECS Fargate** with a **Neon PostgreSQL** database and **Upstash Redis** broker.

---

## Overview

Resume Screener AI automates the entire hiring pipeline — from resume ingestion to candidate comparison and interview scheduling. It supports:

- Batch processing of PDF, DOCX, PNG, JPG, BMP, TIFF and TXT resumes
- OCR-based text extraction (Tesseract) for scanned documents
- AI-powered structured profile extraction (Groq / Gemini)
- Candidate scoring and ranking against a job description (0–100)
- Duplicate detection via exact fields + embedding cosine similarity
- Full multi-tenant HR workflow: companies, departments, jobs, interviews, notes, tags, status, compare, CSV export
- Credit-based billing with Stripe checkout + webhook fulfillment
- Interview scheduling with ICS calendar invites and Google Calendar integration

The backend runs three containerized services on AWS ECS Fargate (API, Celery worker, Celery beat), all configured from a single Secrets Manager secret.

---

## Architecture

```
┌──────────────┐   vercel.json proxy   ┌──────────────────────────────┐
│  Next.js 16  │────── /api/* ───────▶ │  AWS ECS Fargate (rsn-cluster)│
│   (Vercel)   │                       │  ┌─────────────────────────┐ │
└──────────────┘                       │  │  rsn-api  (uvicorn:8002) │ │
                                       │  └─────────────────────────┘ │
                                       │  ┌─────────────────────────┐ │
                                       │  │ rsn-worker (Celery ×4)  │ │
                                       │  └─────────────────────────┘ │
                                       │  ┌─────────────────────────┐ │
                                       │  │  rsn-beat   (scheduler) │ │
                                       │  └─────────────────────────┘ │
                                       └──────────────┬───────────────┘
                                                      │
              ┌───────────────────┬───────────────────┼───────────────────┐
              │                   │                   │                   │
    ┌─────────▼────────┐  ┌───────▼──────┐   ┌────────▼────────┐  ┌───────▼────────┐
    │ Neon PostgreSQL   │  │ Upstash Redis│   │  Groq / Gemini  │  │ Google OAuth    │
    │ (multi-tenant DB) │  │ (Celery)     │   │  (LLM + embed)  │  │ (Calendar/Gmail)│
    └───────────────────┘  └──────────────┘   └─────────────────┘  └────────────────┘
```

| Component | Role |
|-----------|------|
| **Next.js 16** | Frontend — App Router, React 19, Tailwind CSS 4 (deployed on Vercel) |
| **FastAPI** | REST API — auth, uploads, candidates, credits, jobs, interviews |
| **Celery + Upstash Redis** | Async task queue + beat scheduler |
| **Neon (PostgreSQL)** | Primary data store — users, companies, profiles, jobs, transactions |
| **Groq / Gemini** | LLM providers — profile extraction, scoring, embedding (Gemini `gemini-embedding-001`) |
| **Stripe** | Credit packs & payments |
| **Tesseract + Poppler** | OCR + PDF rasterization |
| **AWS EFS** | Shared upload volume across API + worker containers |

### Production deployment (AWS)

All three services run as **Fargate** tasks in cluster `rsn-cluster`, pulling one shared image from **ECR** (`resume-screener:latest`):

| Service | Command | CPU / Memory |
|---------|---------|--------------|
| `rsn-api` | `uvicorn app.main:app --host 0.0.0.0 --port 8002` | 1 vCPU / 2 GB |
| `rsn-worker` | `celery -A app.celery_app worker --concurrency=4` | 2 vCPU / 4 GB |
| `rsn-beat` | `celery -A app.celery_app beat` | 0.25 vCPU / 0.5 GB |

All environment variables are injected from a single **AWS Secrets Manager** secret (`rsn/env`) via ECS task definitions. The frontend proxies `/api/*` to the Application Load Balancer via `frontend/vercel.json`.

---

## Tech Stack

### Backend
| Technology | Version |
|------------|---------|
| Python | 3.11 |
| FastAPI | 0.115 |
| SQLAlchemy (async) | 2.0 |
| Celery | 5.4 |
| Redis (redis-py) | 5.2 |
| OpenAI SDK (Groq provider) | ≥1.66 |
| google-genai | 1.8 |
| Stripe | 11.3 |
| asyncpg | 0.30 |
| Tesseract / pytesseract | 0.3.13 |
| PyPDF2 / python-docx / pdf2image | document parsing |

### Frontend
| Technology | Version |
|------------|---------|
| Next.js | 16.2 |
| React | 19.2 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| framer-motion | 12 |
| Radix UI | 1.x |

---

## Features

### Resume Processing
- **Batch upload** — ZIP or multi-file upload; PDF, DOCX, PNG, JPG, BMP, TIFF, TXT
- **OCR extraction** — Tesseract-based text extraction for scanned images
- **Structured profile extraction** — LLM parses name, email, phone, skills, education, experience, summary into structured JSON
- **Duplicate detection** — exact-field match (email/phone/linkedin/github) + embedding cosine similarity (`≥ 0.95`), review queue
- **Real-time progress** — job status with processed/failed/total counters, polling UI
- **Retry & reanalyze** — retry failed files, reanalyze a batch against a new job description

### AI Analysis & Scoring
- **Job description matching** — per-candidate score (0–100) via multi-agent analysis
- **Skill extraction** — matched + missing skills per candidate
- **Quality checks** — automated resume-quality flags (missing contact info, short experience, etc.)
- **Categorization** — Strong / Good / Average / Weak match
- **Weight tuning** — adjust skill, experience, education, certification, project weights
- **Knowledge base** — company-specific job description & skill enrichment

### HR Workflow
- **Multi-tenant** — companies, departments, per-user data isolation
- **Candidate list** — sortable/filterable table, score slider, status filter
- **Candidate detail** — full profile, skills, experience, notes, status
- **Bulk actions** — delete, status update, CSV export, side-by-side compare
- **Jobs** — create/manage job descriptions with JD review and approval
- **Interviews** — schedule, reschedule, cancel; ICS calendar invites
- **Notifications & activity logs** — in-app notifications, batch-complete events

### Auth & Billing
- **JWT auth** — register/login, hashed passwords, per-company isolation
- **Google OAuth** — Google login + Calendar/Gmail integration
- **Credit system** — 1 credit per resume scored; free tier + paid packs
- **Stripe** — checkout sessions, idempotent webhook fulfillment

### Reliability
- **Rate limiting** — token-bucket AI rate limiter (in-memory fallback when Redis is unavailable)
- **Circuit breaker** — protects against LLM provider outages
- **Retry with backoff** — Celery `max_retries=3`, exponential backoff, rate-limit-aware
- **Batch duplicate commits** — single transaction for duplicate records (avoids per-row connection churn)
- **Observability** — correlation IDs, task logs, failed-task records, CloudWatch log groups

---

## Project Structure

```
resume-screener-ai/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py            # /api/auth — register, login, me, register-company
│   │   │   ├── auth_google.py     # /api/google/auth — OAuth url, callback, status
│   │   │   ├── upload.py          # /api/upload
│   │   │   ├── analysis.py        # /api/extract-skills, /api/match
│   │   │   ├── bulk.py            # /api/resumes/bulk-upload, bulk-upload-files
│   │   │   ├── batches.py         # /api/resumes/batches — CRUD, reanalyze, retry
│   │   │   ├── candidates.py      # /api/candidates — CRUD, analyze, compare, CSV, duplicates
│   │   │   ├── search.py          # /api/search
│   │   │   ├── dashboard.py       # /api/dashboard/metrics
│   │   │   ├── credits.py         # /api/credits — packs, balance, history, checkout, webhook
│   │   │   ├── companies.py       # /api/v1/companies — profile, departments
│   │   │   ├── jobs.py            # /api/v1/companies — jobs CRUD, review, approve
│   │   │   ├── knowledge.py       # /api/v1/companies — knowledge, templates, documents
│   │   │   ├── interviews.py      # /api/interviews — slots, scheduling, ICS
│   │   │   ├── notifications.py   # /api/notifications — list, read, activity-logs
│   │   │   ├── admin.py           # /api/admin — failed-tasks, task-logs
│   │   │   └── ... 
│   │   ├── services/
│   │   │   ├── ai_service.py              # LLM client (Groq via OpenAI SDK)
│   │   │   ├── async_ai_client.py         # Async AI calls
│   │   │   ├── profile_extraction_service.py  # AI profile parsing
│   │   │   ├── candidate_analysis_service.py  # Scoring + categorization
│   │   │   ├── combined_analysis_agent.py     # Multi-agent JD scoring
│   │   │   ├── scoring_service.py          # Score calculation
│   │   │   ├── categorization_service.py   # Category assignment
│   │   │   ├── quality_agent.py            # Resume quality flags
│   │   │   ├── jd_agent.py                 # JD review / enrichment
│   │   │   ├── embedding_service.py        # Gemini embeddings
│   │   │   ├── vector_service.py           # Embedding storage
│   │   │   ├── duplicate_detection_service.py  # Exact + embedding dup detection
│   │   │   ├── ocr_service.py              # Tesseract OCR
│   │   │   ├── credit_service.py           # Credit balance management
│   │   │   ├── rate_limiter.py             # AI rate limiting
│   │   │   ├── circuit_breaker.py          # Provider circuit breaker
│   │   │   ├── notification_service.py     # In-app notifications
│   │   │   ├── activity_log_service.py     # Activity logging
│   │   │   ├── logging_service.py          # Correlation logger, failed tasks, task logs
│   │   │   ├── email_service.py            # Email delivery
│   │   │   ├── calendar_service.py         # Google Calendar
│   │   │   ├── ics_service.py              # ICS generation
│   │   │   ├── google_auth_service.py      # Google OAuth
│   │   │   └── knowledge_service.py        # Company knowledge base
│   │   ├── tasks/
│   │   │   ├── resume_processing_task.py   # process_resume_file, reanalyze_candidate
│   │   │   ├── reminder_tasks.py           # 24h / 1h interview reminders
│   │   │   └── cleanup_tasks.py            # Old-data cleanup
│   │   ├── models/
│   │   │   ├── orm.py                      # SQLAlchemy models
│   │   │   └── candidate_schemas.py        # Pydantic schemas
│   │   ├── repositories/
│   │   │   └── candidate_repository.py     # Data access layer
│   │   ├── main.py                         # FastAPI app + CORS + routers
│   │   ├── celery_app.py                   # Celery config, queues, beat schedule
│   │   ├── config.py                       # Pydantic settings + Tesseract init
│   │   ├── database.py                     # Async engine + session factory
│   │   ├── auth_utils.py                   # JWT encode/decode
│   │   └── dependencies.py                 # Auth dependency injection
│   ├── tests/                              # Unit, e2e, and integration tests
│   ├── requirements.txt
│   ├── Dockerfile                          # Builds the shared ECR image
│   └── .env                                # Local config (git-ignored)
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Landing
│   │   ├── layout.tsx          # Root layout + theme
│   │   ├── login/ register/    # Auth pages
│   │   ├── onboarding/         # Company onboarding
│   │   ├── analyze/            # Single resume analysis
│   │   ├── bulk/               # Batch upload + progress
│   │   ├── batches/            # Batch history
│   │   ├── candidates/         # Candidate list + detail
│   │   ├── search/             # Candidate search
│   │   ├── jobs/               # Job descriptions
│   │   ├── interviews/         # Interview scheduling
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── billing/            # Credit history
│   │   ├── pricing/            # Pricing plans
│   │   └── settings/           # Settings
│   ├── components/             # UI components (sidebar, upload, charts, etc.)
│   ├── lib/api.ts              # API client + auth helpers
│   ├── vercel.json             # /api/* proxy → ALB
│   └── package.json
└── README.md
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (for a local Redis) **or** an Upstash Redis instance
- Tesseract OCR installed (`apt-get install tesseract-ocr` on Linux, UB-Mannheim installer on Windows)
- A Neon PostgreSQL database
- Groq API key (and optionally Gemini for embeddings)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  |  source venv/bin/activate  (macOS/Linux)
pip install -r requirements.txt
```

Create `.env` (see `backend/.env` for all keys):

```env
# AI
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# Database
NEON_DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# Redis / Celery (local Docker: redis://localhost:6379/0)
REDIS_URL=redis://localhost:6379/0

# Payments (optional for local)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Run the API **and** the Celery worker in two terminals:

```bash
# Terminal 1 — API server
python run.py                    # http://localhost:8002, docs at /docs

# Terminal 2 — Celery worker (required to process uploads)
celery -A app.celery_app worker --loglevel=info --pool=solo
```

> **Note:** Uploads dispatch `process_resume_file` to Celery. Without a running worker, jobs are created but never processed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

The API client defaults to `http://localhost:8002` when `NEXT_PUBLIC_API_URL` is unset, and the Vercel rewrite (`vercel.json`) proxies `/api/*` to the ALB in production.

---

## Testing

```bash
cd backend
# Unit tests (no DB required)
python -m pytest tests/test_auth_utils.py tests/test_rate_limiter.py \
    tests/test_embedding_service.py tests/test_duplicate_detection.py -v

# Full suite (requires NEON_DATABASE_URL in .env)
python -m pytest -v
```

Key suites: `test_e2e_flow.py`, `test_multi_tenant_auth.py`, `test_combined_analysis.py`, `test_golden_resumes.py`, `test_interviews.py`, `test_job_management.py`.

---

## API Overview

All endpoints are documented interactively at `/docs` (Swagger UI).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get JWT |
| POST | `/api/auth/register-company` | ✓ | Onboard a company |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/google/auth/url` | ✓ | Google OAuth URL |
| GET | `/api/google/auth/callback` | — | OAuth callback |
| POST | `/api/upload` | ✓ | Upload single resume |
| POST | `/api/extract-skills` | ✓ | AI skill extraction |
| POST | `/api/match` | ✓ | Match resume vs job description |
| POST | `/api/resumes/bulk-upload` | ✓ | Upload ZIP of resumes |
| POST | `/api/resumes/bulk-upload-files` | ✓ | Upload multiple files |
| GET | `/api/resumes/bulk-upload/{job_id}` | ✓ | Job status |
| GET | `/api/resumes/batches` | ✓ | Batch history |
| GET | `/api/resumes/batches/{job_id}` | ✓ | Batch detail |
| DELETE | `/api/resumes/batches/{job_id}` | ✓ | Delete batch + candidates |
| POST | `/api/resumes/batches/{job_id}/reanalyze` | ✓ | Reanalyze with new JD |
| POST | `/api/resumes/batches/{job_id}/retry` | ✓ | Retry failed files |
| GET | `/api/candidates` | ✓ | List/filter candidates (`batch_id`, `category`, `search`…) |
| GET | `/api/candidates/{id}` | ✓ | Candidate detail |
| PATCH | `/api/candidates/{id}` | ✓ | Update score/status/notes |
| DELETE | `/api/candidates/{id}` | ✓ | Delete candidate |
| POST | `/api/candidates/analyze` | ✓ | Score candidate vs JD |
| GET | `/api/candidates/{id}/duplicates` | ✓ | Duplicate flags |
| GET | `/api/candidates/duplicates/pending` | ✓ | Pending duplicate review |
| POST | `/api/candidates/bulk/delete` | ✓ | Bulk delete |
| POST | `/api/candidates/bulk/status` | ✓ | Bulk status update |
| POST | `/api/candidates/compare` | ✓ | Side-by-side compare |
| GET | `/api/candidates/export/csv` | ✓ | Export to CSV |
| POST | `/api/search/candidates` | ✓ | Full-text search |
| GET | `/api/dashboard/metrics` | ✓ | Dashboard metrics |
| GET | `/api/credits/packs` | ✓ | Credit packs |
| GET | `/api/credits/balance` | ✓ | Credit balance |
| GET | `/api/credits/history` | ✓ | Credit transactions |
| POST | `/api/credits/create-checkout` | ✓ | Stripe checkout session |
| POST | `/api/credits/webhook` | — | Stripe webhook |
| GET | `/api/v1/companies/{id}` | ✓ | Company profile |
| PATCH | `/api/v1/companies/{id}` | ✓ | Update company |
| GET/POST | `/api/v1/companies/{id}/jobs` | ✓ | Jobs CRUD |
| POST | `/api/v1/companies/{id}/jobs/review` | ✓ | JD review |
| GET/POST | `/api/v1/companies/{id}/knowledge` | ✓ | Knowledge base |
| GET/POST | `/api/interviews` | ✓ | Interview scheduling |
| GET/POST | `/api/interviews/slots` | ✓ | Interview slots |
| GET | `/api/interviews/{id}/ics` | ✓ | Download ICS invite |
| GET | `/api/notifications` | ✓ | Notifications |
| GET | `/api/notifications/activity-logs` | ✓ | Activity logs |
| GET | `/api/admin/failed-tasks` | ✓ | Failed tasks (admin) |
| GET | `/api/admin/task-logs` | ✓ | Task logs (admin) |

---

## Deploying to Production (AWS)

The project is deployed with **AWS ECS Fargate** (backend) + **Vercel** (frontend).

### Backend image build & push

```bash
cd backend

# Authenticate Docker to ECR (get the token from AWS)
aws ecr get-login-password --region ap-southeast-1 \
  | docker login --username AWS --password-stdin 134604497809.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t resume-screener:latest .
docker tag resume-screener:latest 134604497809.dkr.ecr.ap-southeast-1.amazonaws.com/resume-screener:latest
docker push 134604497809.dkr.ecr.ap-southeast-1.amazonaws.com/resume-screener:latest
```

### Update ECS services

```bash
aws ecs update-service --cluster rsn-cluster --service rsn-api --force-new-deployment --region ap-southeast-1
aws ecs update-service --cluster rsn-cluster --service rsn-worker --force-new-deployment --region ap-southeast-1
aws ecs update-service --cluster rsn-cluster --service rsn-beat --force-new-deployment --region ap-southeast-1
```

### Configuration via Secrets Manager

All environment variables live in the `rsn/env` secret (region `ap-southeast-1`). Task definitions map every variable from this secret, so changing a value requires only a redeploy:

```bash
aws secretsmanager put-secret-value --secret-id rsn/env \
  --secret-string '{"REDIS_URL":"rediss://...", ...}' --region ap-southeast-1
```

### Frontend (Vercel)

Deploy the `frontend/` directory to Vercel. `frontend/vercel.json` rewrites `/api/*` to the ALB:

```json
{ "rewrites": [{ "source": "/api/:path*",
                 "destination": "http://rsn-alb-...ap-southeast-1.elb.amazonaws.com/api/:path*" }] }
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_PROVIDER` | ✓ | `groq` or `gemini` |
| `GROQ_API_KEY` | ✓ | Groq API key (primary LLM) |
| `GROQ_MODEL` | ✓ | e.g. `openai/gpt-oss-120b` |
| `GEMINI_API_KEY` | ✓ | Gemini API key (embeddings) |
| `GEMINI_MODEL` | ✓ | e.g. `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | ✓ | e.g. `gemini-embedding-001` |
| `MAX_TEXT_LENGTH` | — | Resume text truncation limit |
| `NEON_DATABASE_URL` | ✓ | PostgreSQL (Neon) connection string |
| `REDIS_URL` | ✓ | Celery broker/backend. Upstash: `rediss://...:6379?ssl_cert_reqs=required` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | — | Upstash REST API access |
| `QDRANT_URL` / `QDRANT_API_KEY` | — | Vector DB (legacy — embeddings stored in DB) |
| `JWT_SECRET` / `JWT_ALGORITHM` / `JWT_EXPIRY_HOURS` | ✓ | Auth tokens |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | ✓ | Stripe API keys |
| `STRIPE_WEBHOOK_SECRET` | ✓ | Webhook signing secret |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | ✓ | Stripe price IDs |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth |
| `GOOGLE_REDIRECT_URI` | — | OAuth callback URL |
| `EMAILJS_*` | — | Email fallback |
| `UPLOAD_DIR` | — | Upload path (EFS in production) |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | — | AI rate limit |
| `MOCK_EXTERNAL_SERVICES` | — | Mock external APIs flag |

---

## License

MIT