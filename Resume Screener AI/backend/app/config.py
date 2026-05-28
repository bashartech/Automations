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

    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()
