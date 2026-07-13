import os
# Import config first to initialize Tesseract and add to PATH
from app.config import Settings, get_settings, TESSERACT_CMD, TESSERACT_DIR

# Verify Tesseract is accessible
if not os.path.exists(TESSERACT_CMD):
    print(f"WARNING: Tesseract not found at {TESSERACT_CMD}")
else:
    print(f"[OK] Tesseract configured at {TESSERACT_CMD}")
    print(f"[OK] Tesseract directory added to PATH: {TESSERACT_DIR}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, analysis, candidates, search, dashboard, bulk, batches, auth, credits
from app.database import init_db, async_session
from app.models.orm import CreditPack
from sqlalchemy import select

app = FastAPI(
    title="Resume Screener AI API",
    description="AI-powered resume screening and matching system",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(candidates.router)
app.include_router(search.router)
app.include_router(dashboard.router)
app.include_router(bulk.router)
app.include_router(batches.router)
app.include_router(auth.router)
app.include_router(credits.router)


async def seed_credit_packs():
    settings = get_settings()
    packs = [
        {"name": "Free Trial", "price_cents": 0, "credits": 20, "stripe_price_id": None},
        {"name": "Starter", "price_cents": 3900, "credits": 500, "stripe_price_id": settings.stripe_price_starter},
        {"name": "Pro", "price_cents": 7900, "credits": 2000, "stripe_price_id": settings.stripe_price_pro},
    ]
    async with async_session() as db:
        for p in packs:
            existing = await db.execute(
                select(CreditPack).where(CreditPack.name == p["name"])
            )
            row = existing.scalar_one_or_none()
            if row:
                if row.stripe_price_id != p["stripe_price_id"]:
                    from sqlalchemy import update as sql_update
                    await db.execute(
                        sql_update(CreditPack)
                        .where(CreditPack.id == row.id)
                        .values(stripe_price_id=p["stripe_price_id"])
                    )
            else:
                db.add(CreditPack(**p))
        await db.commit()
    print("[OK] Credit packs seeded")


@app.on_event("startup")
async def startup():
    try:
        await init_db()
        print("[OK] Database tables initialized")
    except Exception as e:
        print(f"[!] Database init skipped: {e}")
    try:
        await seed_credit_packs()
    except Exception as e:
        print(f"[!] Credit pack seed skipped: {e}")

@app.get("/")
async def root():
    return {"message": "Resume Screener AI API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
