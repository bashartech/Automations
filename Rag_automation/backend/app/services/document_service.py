import os
from typing import List
from unstructured.partition.pdf import partition_pdf
from unstructured.partition.docx import partition_docx
from unstructured.partition.pptx import partition_pptx
from pypdf import PdfReader

def extract_text(file_location: str, filename: str) -> str:
    """
    Extract text from uploaded file.
    """
    try:
        _, extension = os.path.splitext(filename)
        extension = extension.lower()
        
        if extension == ".pdf":
            elements = partition_pdf(file_location)
        elif extension == ".docx":
            elements = partition_docx(file_location)
        elif extension == ".pptx":
            elements = partition_pptx(file_location)
        else:
            with open(file_location, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            return text

        text = "\n".join([str(el) for el in elements])
        return text
        
    except Exception as e:
        print(f"Error extracting text with unstructured: {e}")
        # Fallback
        if extension == ".pdf":
            try:
                reader = PdfReader(file_location)
                text = "\n".join([page.extract_text() or "" for page in reader.pages])
                return text
            except Exception:
                return ""
        else:
            return ""

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks based on words.
    """
    if not text:
        return []
    
    words = text.split()
    chunks = []
    
    i = 0
    while i < len(words):
        chunk = words[i:i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
        
    return chunks
