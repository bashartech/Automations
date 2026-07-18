# Resume Screener AI

**AI-powered batch resume screening and candidate ranking system** — upload resumes in bulk, extract structured profiles via LLM, score and rank candidates against a job description, and manage the full HR workflow with authentication, credits, and payment processing.

---

## Overview

Resume Screener AI automates the entire hiring pipeline from resume ingestion to candidate comparison. Built for production-scale use, it supports batch processing, OCR-based text extraction from PDFs and images, AI-powered skill extraction and scoring, duplicate detection, and a full HR workflow with notes, tags, status tracking, compare tool, and CSV export.

The system uses Groq (via OpenAI SDK) as the primary inference provider with automatic rate-limit handling and worker-concurrency control.

---

## Architecture

```
┌──────────────┐     ┌───────────────┐     ┌────────────┐
│   Next.js 16  │────▶│  FastAPI       │────▶│  PostgreSQL │
│   (Vercel)    │     │  (HS Spaces)   │     │  (Neon)     │
└──────────────┘     └───────┬───────┘     └────────────┘
                             │
                    ┌────────┴────────┐
                    │  Celery Worker  │
                    │  (Redis Broker) │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │   Qdrant        │
                    │  (Vector DB)    │
                    └─────────────────┘
```

| Component | Role |
|-----------|------|
| **Next.js 16** | Frontend — App Router, React 19, Tailwind CSS 4 |
| **FastAPI** | REST API — file upload, auth, credits, candidate management |
| **Celery + Redis** | Async task queue — processes resumes in background |
| **Neon (PostgreSQL)** | Primary data store — users, profiles, jobs, transactions |
| **Qdrant** | Vector database — duplicate detection via text embeddings |
| **Groq / Gemini** | LLM providers — profile extraction, scoring, categorization |

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.14 | Runtime |
| FastAPI 0.115 | Async REST framework |
| SQLAlchemy 2.0 | Async ORM |
| Celery 5.4 | Task queue |
| Redis 5.2 | Message broker |
| Qdrant 1.13 | Vector similarity search |
| OpenAI SDK (Groq) | LLM inference |
| Stripe 11.3 | Payment processing |
| Tesseract + pytesseract | OCR on images |
| PyPDF2 + python-docx | PDF/DOCX parsing |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16.2 | React framework (App Router) |
| React 19.2 | UI library |
| TypeScript 5 | Type safety |
| Tailwind CSS 4 | Utility-first styling |

---

## Features

### Resume Processing
- **Batch upload** — drag-and-drop multiple PDF, DOCX, PNG, JPG files
- **OCR extraction** — Tesseract-based text extraction from scanned images
- **Structured profile extraction** — LLM parses name, email, phone, skills, education, experience, summary into structured JSON
- **Duplicate detection** — vector similarity + text similarity scoring, duplicate review queue
- **Real-time progress** — polling-based progress bar with processed/failed counters

### AI Analysis & Scoring
- **Job description matching** — score each candidate against a JD (0–100%)
- **Skill extraction** — extract matched and missing skills per candidate
- **Categorization** — auto-categorize candidates (e.g., Strong Match, Possible Match, Not a Match)
- **Profile weight tuning** — adjust importance of skills, experience, education, certifications

### HR Workflow
- **Candidate list** — sortable, filterable table with score slider and status filter
- **Candidate detail** — full profile, skills, experience, notes, status dropdown
- **Notes** — add and view notes on each candidate
- **Bulk actions** — delete, status update, CSV export, side-by-side compare (2+ candidates)
- **Batch management** — batch history, retry failed, reanalyze with new JD

### Authentication & Billing
- **JWT auth** — register/login with hashed tokens, per-user data isolation
- **Credit system** — 1 credit per resume scored, 20 free on signup
- **Pricing** — Starter ($39 / 500 credits), Pro ($79 / 2000 credits)
- **Stripe integration** — checkout sessions, webhook-based credit fulfillment with idempotency (unique `stripe_session_id`)

### Reliability
- **Rate-limit handling** — Groq 8k TPM limit respected via `worker_concurrency=1` and exponential backoff
- **Token limit safety** — context truncation at 3000 chars, per-field limits in profile extraction
- **Idempotent payments** — duplicate webhook events caught via `IntegrityError` on unique `stripe_session_id`
- **No shared-filesystem deployment** — text extracted on upload, stored in DB `raw_texts` JSON column, Celery reads from DB

---

## Project Structure

```
resume-screener-ai/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   │   ├── auth.py       # Login, register, me
│   │   │   ├── upload.py     # File upload
│   │   │   ├── analysis.py   # Extract & match
│   │   │   ├── bulk.py       # Bulk upload
│   │   │   ├── batches.py    # Batch CRUD, reanalyze, retry
│   │   │   ├── candidates.py # Candidate CRUD, CSV export, compare
│   │   │   ├── search.py     # Full-text search
│   │   │   ├── dashboard.py  # Dashboard stats
│   │   │   └── credits.py    # Checkout, webhook, history
│   │   ├── services/         # Business logic
│   │   │   ├── ai_service.py              # LLM client
│   │   │   ├── profile_extraction.py      # AI profile parsing
│   │   │   ├── candidate_analysis.py      # Scoring + categorization
│   │   │   ├── scoring_service.py         # Score calculation
│   │   │   ├── categorization_service.py  # Category assignment
│   │   │   ├── duplicate_detection.py     # Qdrant + text similarity
│   │   │   ├── ocr_service.py             # Tesseract OCR
│   │   │   └── credit_service.py          # Credit balance management
│   │   ├── tasks/
│   │   │   └── resume_processing_task.py  # Celery async tasks
│   │   ├── models/
│   │   │   ├── orm.py          # SQLAlchemy models
│   │   │   └── candidate_schemas.py  # Pydantic schemas
│   │   ├── repositories/
│   │   │   └── candidate_repository.py  # Data access layer
│   │   ├── main.py            # FastAPI app + CORS + routes
│   │   ├── celery_app.py      # Celery configuration
│   │   ├── config.py          # Settings + Tesseract init
│   │   ├── database.py        # AsyncSession factory
│   │   ├── auth_utils.py      # Token encode/decode
│   │   └── dependencies.py    # Auth dependency injection
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home/dashboard
│   │   ├── layout.tsx         # Root layout + sidebar
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── analyze/           # Single resume analysis
│   │   ├── bulk/              # Batch upload + progress
│   │   ├── batches/           # Batch history
│   │   ├── candidates/        # Candidate list + detail
│   │   ├── search/            # Candidate search
│   │   ├── billing/           # Credit history
│   │   └── pricing/           # Pricing plans
│   ├── components/
│   │   ├── AuthSidebar.tsx    # Sign in/out sidebar
│   │   ├── FileUpload.tsx     # Drag-and-drop uploader
│   │   └── ResultsDisplay.tsx # Analysis results
│   ├── lib/
│   │   └── api.ts             # API client + auth helpers
│   └── package.json
└── README.md
```

---

## Setup

### Prerequisites
- Python 3.14+
- Node.js 20+
- Tesseract OCR (for image-based resumes)
- PostgreSQL (or Neon account)
- Redis (or Upstash)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

Configure `.env`:

```env
NEON_DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=https://...qdrant.io
QDRANT_API_KEY=...
```

Run:

```bash
uvicorn app.main:app --port 8002 --reload
celery -A app.celery_app worker --loglevel=info --concurrency=1
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8002` for local development.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/upload` | ✓ | Upload single resume |
| POST | `/api/bulk/upload` | ✓ | Upload multiple resumes |
| POST | `/api/extract-skills` | ✓ | AI skill extraction |
| POST | `/api/analyze` | ✓ | Score candidate vs JD |
| GET | `/api/candidates` | ✓ | List candidates (filtered, paginated) |
| GET | `/api/candidates/:id` | ✓ | Candidate detail |
| PATCH | `/api/candidates/:id` | ✓ | Update score, status, notes |
| DELETE | `/api/candidates/:id` | ✓ | Delete candidate |
| POST | `/api/candidates/bulk` | ✓ | Bulk delete / status update |
| POST | `/api/candidates/compare` | ✓ | Side-by-side comparison |
| GET | `/api/candidates/export/csv` | ✓ | Export to CSV |
| GET | `/api/resumes/batches` | ✓ | Batch history |
| DELETE | `/api/resumes/batches/:id` | ✓ | Delete batch + candidates |
| POST | `/api/resumes/batches/:id/reanalyze` | ✓ | Reanalyze with new JD |
| POST | `/api/resumes/batches/:id/retry` | ✓ | Retry failed files |
| GET | `/api/search?q=` | ✓ | Full-text search |
| GET | `/api/dashboard/stats` | ✓ | Dashboard metrics |
| POST | `/api/credits/create-checkout` | ✓ | Stripe checkout session |
| POST | `/api/credits/webhook` | — | Stripe event webhook |
| GET | `/api/credits/history` | ✓ | Credit transaction log |

---

## Deployment

### Backend (Hugging Face Spaces)
The FastAPI backend deploys as a Hugging Face Space with:
- Docker container running uvicorn + Celery
- Persistent volume for uploads
- Environment variables configured via Space secrets

### Frontend (Vercel)
Deploy the Next.js frontend to Vercel with:
```
NEXT_PUBLIC_API_URL=https://your-backend.hf.space
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEON_DATABASE_URL` | ✓ | PostgreSQL connection string |
| `GROQ_API_KEY` | ✓ | Groq API key (primary LLM) |
| `OPENAI_API_KEY` | ✓ | OpenAI-compatible fallback |
| `GEMINI_API_KEY` | — | Gemini API key (fallback) |
| `REDIS_URL` | ✓ | Redis connection for Celery |
| `QDRANT_URL` | ✓ | Qdrant vector DB endpoint |
| `QDRANT_API_KEY` | ✓ | Qdrant API key |
| `STRIPE_SECRET_KEY` | ✓ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✓ | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | ✓ | Price ID for Starter pack |
| `STRIPE_PRICE_PRO` | ✓ | Price ID for Pro pack |

---

## License

MIT
