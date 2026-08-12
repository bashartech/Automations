import os
import sys
from pydantic_settings import BaseSettings
from functools import lru_cache

# Configure Tesseract OCR path - MUST be done before any pytesseract import.
# Precedence: TESSERACT_CMD env var (Set in Docker via ENV) > OS default.
_env_tesseract = os.environ.get('TESSERACT_CMD', '').strip()
if _env_tesseract:
    TESSERACT_CMD = _env_tesseract
elif sys.platform == 'win32':
    TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
else:
    TESSERACT_CMD = '/usr/bin/tesseract'

TESSERACT_DIR = os.path.dirname(TESSERACT_CMD)

# Add Tesseract to system PATH
if TESSERACT_DIR and TESSERACT_DIR not in os.environ.get('PATH', ''):
    os.environ['PATH'] = TESSERACT_DIR + os.pathsep + os.environ.get('PATH', '')

# Now configure pytesseract
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = TESSERACT_CMD

class Settings(BaseSettings):
    gemini_api_key: str = "test_key"
    gemini_model: str = "gemini-1.5-pro"
    gemini_embedding_model: str = "models/text-embedding-004"
    max_text_length: int = 50000
    tesseract_cmd: str = TESSERACT_CMD

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_temperature: float = 0.7
    groq_max_tokens: int = 2500

    ai_provider: str = "groq"

    neon_database_url: str = ""
    redis_url: str = "redis://localhost:6379/0"
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    upload_dir: str = "uploads"

    jwt_secret: str = "resume-screener-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_starter: str = ""
    stripe_price_pro: str = ""

    rate_limit_requests_per_minute: int = 30

    google_calendar_credentials: str = ""
    google_calendar_calendar_id: str = "primary"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/google/auth/callback"
    emailjs_service_id: str = ""
    emailjs_template_id: str = ""
    emailjs_user_id: str = ""
    emailjs_access_token: str = ""
    mock_external_services: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()
