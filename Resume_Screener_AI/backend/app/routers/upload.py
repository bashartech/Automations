from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse
import os
import aiofiles
from pathlib import Path
import PyPDF2
import io
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/api", tags=["upload"])
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def extract_text_from_pdf(content: bytes, filename: str = None) -> str:
    """Extract text from PDF bytes with OCR fallback for scanned PDFs"""
    temp_file_path = None
    try:
        # First try text extraction with PyPDF2
        pdf_file = io.BytesIO(content)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if text.strip():
            return text.strip()
        
        # Fallback to OCR for scanned PDFs
        # Save to temporary file for OCR processing
        temp_file_path = UPLOAD_DIR / f"temp_{os.urandom(8).hex()}.pdf"
        async with aiofiles.open(str(temp_file_path), 'wb') as f:
            await f.write(content)
        
        text = OCRService.extract_text_from_pdf_ocr(str(temp_file_path))
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass

async def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes"""
    try:
        from docx import Document
        docx_file = io.BytesIO(content)
        doc = Document(docx_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from DOCX: {str(e)}")

async def extract_text_from_image(content: bytes) -> str:
    """Extract text from image bytes using OCR"""
    try:
        import pytesseract
        from PIL import Image
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except ImportError:
        raise Exception("OCR libraries not installed. Please install pytesseract and Pillow.")
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}")

@router.post("/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and extract text from resume file"""

    # Validate file size (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Validate file type
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    try:
        # Extract text based on file type
        if file_ext == '.pdf':
            extracted_text = await extract_text_from_pdf(content, file.filename)
        elif file_ext in ['.png', '.jpg', '.jpeg']:
            extracted_text = await extract_text_from_image(content)
        elif file_ext == '.docx':
            extracted_text = await extract_text_from_docx(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")

        return UploadResponse(
            filename=file.filename,
            extracted_text=extracted_text,
            message="File uploaded and text extracted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
