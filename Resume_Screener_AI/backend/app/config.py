import os
import sys
from pydantic_settings import BaseSettings
from functools import lru_cache

# Configure Tesseract OCR path - MUST be done before any pytesseract import
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
TESSERACT_DIR = r'C:\Program Files\Tesseract-OCR'

# Add Tesseract to system PATH
if TESSERACT_DIR not in os.environ.get('PATH', ''):
    os.environ['PATH'] = TESSERACT_DIR + os.pathsep + os.environ.get('PATH', '')

# Now configure pytesseract
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = TESSERACT_CMD

class Settings(BaseSettings):
    gemini_api_key: str = "test_key"
    gemini_model: str = "gemini-1.5-pro"
    max_text_length: int = 50000
    tesseract_cmd: str = TESSERACT_CMD

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_temperature: float = 0.7
    groq_max_tokens: int = 8192

    ai_provider: str = "groq"

    neon_database_url: str = ""
    redis_url: str = "redis://localhost:6379/0"
    qdrant_url: str = ""
    qdrant_api_key: str = ""

    upload_dir: str = "uploads"

    jwt_secret: str = "resume-screener-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_starter: str = ""
    stripe_price_pro: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()
