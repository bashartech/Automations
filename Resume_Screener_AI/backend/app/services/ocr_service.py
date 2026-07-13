
# --- Tesseract configuration must be set before pytesseract import ---
import os
import shutil

def _find_tesseract():
    # 1. Environment variable override (e.g. set in HF Spaces)
    env_cmd = os.environ.get("TESSERACT_CMD")
    if env_cmd and os.path.exists(env_cmd):
        return env_cmd, os.path.dirname(env_cmd)

    # 2. Platform-specific defaults
    if os.name == "nt":  # Windows
        return (r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files\Tesseract-OCR")
    else:  # Linux / macOS
        # `which` resolves symlinks and common install paths
        found = shutil.which("tesseract")
        if found:
            return found, os.path.dirname(found)

    # 3. Nothing found
    return "tesseract", ""  # let pytesseract raise its own error

TESSERACT_CMD, TESSERACT_DIR = _find_tesseract()

if TESSERACT_DIR and TESSERACT_DIR not in os.environ.get("PATH", ""):
    os.environ["PATH"] = TESSERACT_DIR + os.pathsep + os.environ.get("PATH", "")

import pytesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
print(f"[DEBUG] pytesseract.tesseract_cmd set to: {pytesseract.pytesseract.tesseract_cmd}")
from pdf2image import convert_from_path
from PIL import Image
from PyPDF2 import PdfReader
from docx import Document

if not shutil.which(TESSERACT_CMD) and not os.path.exists(TESSERACT_CMD):
    raise RuntimeError(f"Tesseract not found at {TESSERACT_CMD}")

class OCRService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF using PyPDF2, fallback to OCR if needed"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            if text.strip():
                return text

            # Fallback to OCR if no text extracted
            return OCRService.extract_text_from_pdf_ocr(file_path)
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    @staticmethod
    def extract_text_from_pdf_ocr(file_path: str) -> str:
        """Extract text from PDF using OCR"""
        try:
            images = convert_from_path(file_path)
            if not images:
                raise Exception("No pages could be extracted from PDF")
            
            text = ""
            for idx, image in enumerate(images):
                try:
                    # Ensure image is in RGB mode for better OCR performance
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    page_text = pytesseract.image_to_string(image)
                    if page_text.strip():
                        text += page_text + "\n"
                except Exception as page_error:
                    raise Exception(f"Error processing page {idx + 1}: {str(page_error)}")
            
            if not text.strip():
                raise Exception("No text could be extracted from PDF pages")
            
            return text
        except Exception as e:
            raise Exception(f"Error performing OCR on PDF: {str(e)}")

    @staticmethod
    def extract_text_from_image(file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from DOCX: {str(e)}")

    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        """Extract text from plain text file"""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            raise Exception(f"Error extracting text from TXT: {str(e)}")

    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract text based on file extension"""
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()

        if ext == '.pdf':
            return OCRService.extract_text_from_pdf(file_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
            return OCRService.extract_text_from_image(file_path)
        elif ext == '.docx':
            return OCRService.extract_text_from_docx(file_path)
        elif ext == '.txt':
            return OCRService.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
