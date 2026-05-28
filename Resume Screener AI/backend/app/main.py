import os
# Import config first to initialize Tesseract and add to PATH
from app.config import Settings, TESSERACT_CMD, TESSERACT_DIR

# Verify Tesseract is accessible
if not os.path.exists(TESSERACT_CMD):
    print(f"WARNING: Tesseract not found at {TESSERACT_CMD}")
else:
    print(f"✓ Tesseract configured at {TESSERACT_CMD}")
    print(f"✓ Tesseract directory added to PATH: {TESSERACT_DIR}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, analysis

app = FastAPI(
    title="Resume Screener AI API",
    description="AI-powered resume screening and matching system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(analysis.router)

@app.get("/")
async def root():
    return {"message": "Resume Screener AI API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
