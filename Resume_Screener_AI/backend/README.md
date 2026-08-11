# Resume Screener AI - Backend

FastAPI backend with AI-powered resume analysis using Gemini API.

## Features

- Resume upload (PDF, DOCX, Images)
- OCR text extraction
- AI-powered skill extraction
- Resume-to-job matching with percentage
- RESTful API endpoints

## Prerequisites

- Python 3.9+
- Tesseract OCR installed
- Gemini API key

## Installation

### 1. Install Tesseract OCR

**Windows:**
Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
Add to PATH: `C:\Program Files\Tesseract-OCR`

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 2. Install Python Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Running the Server

```bash
python run.py
```

Server will start at: http://localhost:8002

API Documentation: http://localhost:8002/docs

## Testing

### Unit Tests (no DB required)

```bash
cd backend
python -m pytest tests/test_analytics.py tests/test_auth_utils.py tests/test_embedding_service.py tests/test_rate_limiter.py tests/test_observability.py tests/test_notifications.py tests/test_duplicate_detection.py -v
```

### Full Test Suite (requires Neon DB)

The `.env` file must contain a valid `NEON_DATABASE_URL`. Run from the `backend/` directory:

```bash
cd backend
python -m pytest -v
```

### End-to-End Tests (requires running server)

Start the server first, then run e2e tests:

```bash
# Terminal 1: Start server
cd backend && python run.py

# Terminal 2: Run e2e tests
cd backend && python -m pytest tests/test_e2e_flow.py -v
```

### Load Testing (requires running server + locust)

```bash
pip install locust
cd backend && python run.py &
locust -f ../locustfile.py --host=http://localhost:8002
# Open http://localhost:8089 in browser
```

### Test Configuration

Tests are configured in `pyproject.toml`:
- `asyncio_mode = "auto"` — async tests auto-detected
- `testpaths = ["tests"]` — test discovery in `tests/` directory
- `python_files = ["test_*.py"]` — only matches `test_*.py` files

## API Endpoints

### Upload Resume
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (PDF, DOCX, PNG, JPG)
```

### Extract Skills
```
POST /api/extract-skills
Content-Type: application/json
Body: {"text": "resume text"}
```

### Match Resume to Job
```
POST /api/match
Content-Type: application/json
Body: {
  "resume_text": "...",
  "job_description": "..."
}
```

### Health Check
```
GET /api/health
```

## Project Structure

```
backend/
├── app/
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── requirements.txt
├── run.py
└── .env
```
