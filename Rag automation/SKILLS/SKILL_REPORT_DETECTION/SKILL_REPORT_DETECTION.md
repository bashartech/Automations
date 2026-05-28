# 📄 Medical Report Detection & Analysis — Complete Implementation Skill

## 📋 Overview
This skill explains how to accurately **detect, extract, and analyze medical reports** from PDFs and images — extracting text, tables, lab values, images, and providing intelligent medical insights with actionable recommendations.

---

## 🔍 Current State Analysis

### ✅ What Already Exists
| Feature | Status | Details |
|---------|--------|---------|
| **PDF Text Extraction** | Working | `pdfplumber` extracts text from each page |
| **Image OCR** | Working | `pytesseract` extracts text from images |
| **Lab Value Parsing** | Working | Regex parser for structured lab reports |
| **AI Text Cleaning** | Working | Gemini fixes spelling mistakes in OCR output |
| **Report Upload Endpoint** | Working | `POST /api/v1/reports/upload` |
| **Chat File Analysis** | Working | `POST /api/v1/chat/analyze` |

### ❌ What's Missing
| Feature | Gap |
|---------|-----|
| **Image Extraction from PDF** | Only text is extracted, embedded images are ignored |
| **Table Detection** | Tables in PDFs are not properly parsed as structured data |
| **Multi-page PDF Analysis** | Only concatenated text, no page-level analysis |
| **Chart/Graph Detection** | Blood pressure charts, ECG images not analyzed |
| **Handwritten Text Detection** | Handwritten notes on reports are not recognized |
| **Report Type Auto-Detection** | User must manually select report type |
| **Abnormal Value Highlighting** | No visual highlighting of out-of-range values |
| **Trend Analysis** | No comparison with previous reports |
| **Multi-language OCR** | Only English OCR, no Urdu/Hindi support |

---

## 🏗️ Architecture: How Report Analysis Currently Works

### Current File Locations
```
backend/app/services/ocr_service.py          — Main OCR + report processing
backend/app/services/report_parser.py        — Lab value regex parser
backend/app/services/report_text_cleaner.py  — AI text cleaning + correction
backend/app/routes/reports_router.py         — Upload endpoint
src/pages/UploadReport.tsx                   — Upload UI
src/pages/AnalysisResults.tsx                — Results display
src/components/upload/FileUploader.tsx       — Drag-and-drop uploader
```

### Current Flow
```
User uploads PDF/Image → OCRService.process_medical_report()
  → Extract text (pdfplumber for PDF, pytesseract for images)
  → AI cleaning via ReportTextCleaner.parse_report_with_ai()
  → Regex fallback if AI fails
  → Parse lab values → Return structured data
```

---

## 🚀 Step-by-Step Implementation

### PHASE 1: Enhanced PDF Extraction (Images + Tables)

#### 1.1 Extract Images from PDF

**File:** `backend/app/services/pdf_image_extractor.py` (NEW)

```python
"""
PDF Image Extractor
====================
Extracts embedded images, charts, and graphs from medical PDF reports.
"""

import io
import os
import base64
from pathlib import Path
from typing import List, Dict, Any
from PIL import Image
import fitz  # PyMuPDF (pip install PyMuPDF)


class PDFImageExtractor:
    """Extract images, charts, and graphs from PDF reports."""
    
    @staticmethod
    def extract_images(pdf_bytes: bytes, output_dir: str = "temp/pdf_images") -> List[Dict[str, Any]]:
        """
        Extract all images from a PDF.
        
        Returns:
            List of dicts with: page_number, image_base64, image_type, description
        """
        extracted = []
        
        try:
            doc = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    
                    if not base_image:
                        continue
                    
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Convert to base64 for API response
                    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                    
                    # Classify image type
                    img_width = base_image.get("width", 0)
                    img_height = base_image.get("height", 0)
                    image_type = PDFImageExtractor._classify_image(
                        img_width, img_height, image_ext, page
                    )
                    
                    extracted.append({
                        "page_number": page_num + 1,
                        "image_index": img_index,
                        "image_base64": image_b64,
                        "image_type": image_type,
                        "width": img_width,
                        "height": img_height,
                        "format": image_ext,
                    })
            
            doc.close()
            return extracted
            
        except Exception as e:
            return [{"error": str(e), "type": "extraction_failed"}]
    
    @staticmethod
    def _classify_image(width: int, height: int, ext: str, page) -> str:
        """Classify extracted image type."""
        aspect_ratio = width / max(height, 1)
        
        # ECG/EKG patterns (long horizontal lines)
        if aspect_ratio > 3:
            return "ecg_strip"
        
        # Charts/graphs (roughly square or landscape)
        if 0.8 <= aspect_ratio <= 2.0 and width > 300:
            return "chart_or_graph"
        
        # X-ray/scan (portrait or square, large)
        if width > 500 and height > 500:
            return "medical_scan"
        
        # Logo or small icon
        if width < 100 and height < 100:
            return "logo_or_icon"
        
        return "unknown"
```

#### 1.2 Extract Tables from PDF

**File:** `backend/app/services/pdf_table_extractor.py` (NEW)

```python
"""
PDF Table Extractor
====================
Extracts tables from medical PDF reports and converts to structured data.
"""

import json
from typing import List, Dict, Any
import fitz
import pdfplumber


class PDFTableExtractor:
    """Extract and parse tables from medical PDF reports."""
    
    @staticmethod
    def extract_tables(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extract all tables from a PDF.
        
        Returns:
            List of dicts with: page_number, headers, rows, lab_values
        """
        extracted = []
        
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    tables = page.extract_tables()
                    
                    for table_index, table in enumerate(tables):
                        if not table or len(table) < 2:
                            continue
                        
                        # First row is usually headers
                        headers = [h.strip() if h else "" for h in table[0]]
                        rows = []
                        
                        for row in table[1:]:
                            cleaned_row = [cell.strip() if cell else "" for cell in row]
                            rows.append(cleaned_row)
                        
                        # Try to detect if this is a lab test table
                        is_lab_table = PDFTableExtractor._is_lab_table(headers, rows)
                        
                        table_data = {
                            "page_number": page_num + 1,
                            "table_index": table_index,
                            "headers": headers,
                            "rows": rows,
                            "is_lab_table": is_lab_table,
                            "lab_values": [],
                        }
                        
                        if is_lab_table:
                            table_data["lab_values"] = PDFTableExtractor._parse_lab_values(
                                headers, rows
                            )
                        
                        extracted.append(table_data)
            
            return extracted
            
        except Exception as e:
            return [{"error": str(e), "type": "table_extraction_failed"}]
    
    @staticmethod
    def _is_lab_table(headers: List[str], rows: List[List[str]]) -> bool:
        """Detect if a table contains lab test results."""
        lab_keywords = [
            "test", "result", "value", "unit", "range", "reference",
            "normal", "hemoglobin", "glucose", "cholesterol", "tsh",
            "creatinine", "urea", "bilirubin", "sgot", "sgpt",
            "hba1c", "wbc", "rbc", "platelet", "neutrophil",
            "lymphocyte", "eosinophil", "mcv", "mch", "mchc"
        ]
        
        header_text = " ".join(headers).lower()
        row_text = " ".join([" ".join(r) for r in rows[:3]]).lower()
        combined = header_text + " " + row_text
        
        matches = sum(1 for kw in lab_keywords if kw in combined)
        return matches >= 2
    
    @staticmethod
    def _parse_lab_values(headers: List[str], rows: List[List[str]]) -> List[Dict[str, Any]]:
        """Parse lab test values from table rows."""
        lab_values = []
        
        # Try to identify column roles
        test_col = None
        result_col = None
        range_col = None
        unit_col = None
        
        for i, h in enumerate(headers):
            h_lower = h.lower()
            if "test" in h_lower or "parameter" in h_lower or "name" in h_lower:
                test_col = i
            elif "result" in h_lower or "value" in h_lower or "finding" in h_lower:
                result_col = i
            elif "range" in h_lower or "reference" in h_lower or "normal" in h_lower:
                range_col = i
            elif "unit" in h_lower:
                unit_col = i
        
        # Auto-detect if columns not identified
        if test_col is None and len(headers) >= 4:
            test_col, result_col, range_col, unit_col = 0, 1, 2, 3
        elif test_col is None and len(headers) >= 2:
            test_col, result_col = 0, 1
        
        for row in rows:
            if not row or len(row) <= max(test_col or 0, result_col or 1):
                continue
            
            lab_values.append({
                "test_name": row[test_col] if test_col is not None else row[0],
                "value": row[result_col] if result_col is not None else (row[1] if len(row) > 1 else ""),
                "ref_range": row[range_col] if range_col is not None else (row[2] if len(row) > 2 else ""),
                "unit": row[unit_col] if unit_col is not None else (row[3] if len(row) > 3 else ""),
            })
        
        return lab_values
```

---

### PHASE 2: Enhanced OCR Service

#### 2.1 Update `ocr_service.py` — Comprehensive Report Analysis

**File:** `backend/app/services/ocr_service.py`

Add the new extraction capabilities:

```python
# Add new imports at top
from app.services.pdf_image_extractor import PDFImageExtractor
from app.services.pdf_table_extractor import PDFTableExtractor

# Update process_medical_report method
@staticmethod
async def process_medical_report(file_bytes: bytes, file_type: str) -> Dict[str, Any]:
    """
    Process medical report with comprehensive extraction.
    Extracts: text, images, tables, lab values, and provides AI analysis.
    """
    try:
        # 1. Extract raw text
        if 'pdf' in file_type:
            ocr_text = await OCRService.extract_text_from_pdf(file_bytes)
        elif 'image' in file_type:
            ocr_text = await OCRService.extract_text_from_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # 2. Extract tables (PDF only)
        tables = []
        if 'pdf' in file_type:
            tables = PDFTableExtractor.extract_tables(file_bytes)
        
        # 3. Extract images (PDF only)
        images = []
        if 'pdf' in file_type:
            images = PDFImageExtractor.extract_images(file_bytes)
        
        # 4. Auto-detect report type
        report_type = OCRService._auto_detect_report_type(ocr_text)
        
        # 5. AI-powered cleaning and analysis
        ai_result = ReportTextCleaner.parse_report_with_ai(ocr_text)
        
        if ai_result.get("success") and ai_result.get("data", {}).get("sections"):
            structured_data = ai_result["data"]
        else:
            # Fallback to regex parser
            structured_data = MedicalReportParser.parse_report(ocr_text)
        
        # 6. Merge table data if available
        if tables:
            structured_data["tables"] = tables
            # Merge lab values from tables
            table_lab_values = []
            for t in tables:
                if t.get("lab_values"):
                    table_lab_values.extend(t["lab_values"])
            if table_lab_values:
                structured_data.setdefault("tests", []).extend(table_lab_values)
        
        # 7. Analyze abnormal values
        abnormal_values = OCRService._find_abnormal_values(structured_data)
        
        # 8. Generate AI summary
        ai_summary = await OCRService._generate_ai_summary(
            ocr_text, structured_data, abnormal_values, report_type
        )
        
        return {
            "ocr_text": ocr_text,
            "structured_data": structured_data,
            "report_type": report_type,
            "tables_extracted": len(tables),
            "images_extracted": len(images),
            "abnormal_values": abnormal_values,
            "ai_summary": ai_summary,
            "word_count": len(ocr_text.split()),
            "character_count": len(ocr_text),
            "success": True
        }
    except Exception as e:
        logger.error(f"Error processing medical report: {e}")
        return {
            "error": str(e),
            "success": False
        }

@staticmethod
def _auto_detect_report_type(text: str) -> str:
    """Auto-detect the type of medical report."""
    text_lower = text.lower()
    
    type_keywords = {
        "blood_test": ["complete blood count", "cbc", "hemoglobin", "wbc", "rbc", "platelet"],
        "urine_test": ["urine analysis", "urinalysis", "pus cell", "epithelial cell", "specific gravity"],
        "liver_test": ["liver function", "lft", "sgot", "sgpt", "bilirubin", "alkaline phosphatase"],
        "kidney_test": ["kidney function", "kft", "creatinine", "urea", "bun", "uric acid"],
        "lipid_profile": ["lipid profile", "cholesterol", "hdl", "ldl", "triglyceride", "vldl"],
        "thyroid": ["thyroid", "tsh", "t3", "t4", "thyroxine"],
        "diabetes": ["hba1c", "fasting blood sugar", "post prandial", "glucose tolerance"],
        "ecg": ["ecg", "ekg", "electrocardiogram", "heart rate", "pr interval", "qrs"],
    }
    
    for report_type, keywords in type_keywords.items():
        if any(kw in text_lower for kw in keywords):
            return report_type
    
    return "general"

@staticmethod
def _find_abnormal_values(structured_data: Dict) -> List[Dict[str, Any]]:
    """Find and highlight abnormal lab values."""
    abnormal = []
    
    for test in structured_data.get("tests", []):
        status = test.get("status", "normal")
        if status in ["high", "low", "abnormal"]:
            abnormal.append({
                "test": test.get("name", "Unknown"),
                "value": test.get("value", ""),
                "ref_range": test.get("ref_range", ""),
                "status": status,
                "severity": "high" if status == "high" else "low",
            })
    
    return abnormal

@staticmethod
async def _generate_ai_summary(text: str, structured: Dict, abnormal: List, report_type: str) -> str:
    """Generate AI-powered summary of the report."""
    try:
        import google.generativeai as genai
        
        prompt = f"""You are a medical lab analyst reviewing a {report_type} report.

EXTRACTED TEXT (first 2000 chars):
{text[:2000]}

STRUCTURED DATA:
{json.dumps(structured, indent=2)[:2000]}

ABNORMAL VALUES:
{json.dumps(abnormal, indent=2)}

Provide a concise summary in this format:
1. Report Type: [detected type]
2. Overall Assessment: [Normal/Abnormal/Critical]
3. Key Findings: [List abnormal values with context]
4. Recommendations: [Suggest follow-up tests or specialist consult if needed]

Keep it under 150 words. Use simple language a patient can understand.
"""
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        return f"Report processed successfully. Found {len(abnormal)} abnormal value(s)."
```

---

### PHASE 3: Image Analysis for Medical Reports

#### 3.1 Analyze Extracted Images with Gemini Vision

**File:** `backend/app/services/report_image_analyzer.py` (NEW)

```python
"""
Report Image Analyzer
======================
Analyzes images extracted from medical reports (ECG strips, charts, X-rays).
"""

import base64
from typing import Dict, Any, List


class ReportImageAnalyzer:
    """Analyze medical images from reports using Gemini Vision."""
    
    @staticmethod
    async def analyze_image(image_base64: str, image_type: str) -> Dict[str, Any]:
        """
        Analyze a medical image using Gemini Vision.
        
        Args:
            image_base64: Base64 encoded image
            image_type: Type of image (ecg_strip, chart_or_graph, medical_scan, etc.)
            
        Returns:
            Analysis results with description and findings
        """
        try:
            import google.generativeai as genai
            
            # Decode image
            image_bytes = base64.b64decode(image_base64)
            
            # Type-specific prompts
            prompts = {
                "ecg_strip": """Analyze this ECG/EKG strip. Describe:
1. Heart rate
2. Rhythm (regular/irregular)
3. Any abnormalities (ST elevation, T wave changes, etc.)
4. Overall interpretation
Keep it concise (under 100 words).""",
                
                "chart_or_graph": """Analyze this medical chart or graph. Describe:
1. What is being measured
2. The trend (increasing/decreasing/stable)
3. Any concerning values
4. Overall interpretation
Keep it concise (under 100 words).""",
                
                "medical_scan": """Analyze this medical scan image. Describe:
1. What type of scan this appears to be
2. Any visible abnormalities
3. Areas of concern
Keep it concise (under 100 words).""",
                
                "unknown": """Describe what you see in this medical image. Include:
1. What type of medical image this might be
2. Any notable findings
3. Areas that may need attention
Keep it concise (under 100 words)."""
            }
            
            prompt = prompts.get(image_type, prompts["unknown"])
            
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            # Create content with image
            response = await model.generate_content_async([
                prompt,
                {
                    "mime_type": "image/png",
                    "data": image_bytes
                }
            ])
            
            return {
                "image_type": image_type,
                "analysis": response.text,
                "success": True
            }
            
        except Exception as e:
            return {
                "image_type": image_type,
                "analysis": f"Image analysis unavailable: {str(e)}",
                "success": False
            }
    
    @staticmethod
    async def analyze_all_images(images: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze all extracted images from a report."""
        results = []
        
        for img in images:
            if img.get("image_base64"):
                analysis = await ReportImageAnalyzer.analyze_image(
                    img["image_base64"],
                    img.get("image_type", "unknown")
                )
                results.append(analysis)
        
        return results
```

---

### PHASE 4: Multi-language OCR Support

#### 4.1 Add Urdu and Hindi OCR

**File:** `backend/app/services/ocr_service.py`

Update the image OCR method:

```python
@staticmethod
async def extract_text_from_image(image_bytes: bytes, lang: str = 'eng') -> str:
    """
    Extract text from image using PyTesseract with multi-language support.
    
    Supported languages:
    - eng: English
    - urd: Urdu  
    - hin: Hindi
    - eng+urd: English + Urdu mixed
    - eng+hin: English + Hindi mixed
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Language-specific configuration
        if lang in ["urd", "eng+urd"]:
            # Urdu-specific settings
            custom_config = r'--oem 3 --psm 6 -l urd'
        elif lang in ["hin", "eng+hin"]:
            # Hindi-specific settings
            custom_config = r'--oem 3 --psm 6 -l hin'
        else:
            custom_config = r'--oem 3 --psm 6 -l eng'
        
        text = pytesseract.image_to_string(image, config=custom_config)
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return "[OCR] Text extraction failed. Please try again or provide a clearer image."
```

#### 4.2 Auto-detect Report Language

```python
@staticmethod
def detect_report_language(text: str) -> str:
    """Detect the primary language of a medical report."""
    urdu_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    
    total = len(text.replace(" ", ""))
    if total == 0:
        return "eng"
    
    if urdu_chars / total > 0.1:
        return "eng+urd"
    elif hindi_chars / total > 0.1:
        return "eng+hin"
    
    return "eng"
```

---

### PHASE 5: Updated Upload Endpoint

#### 5.1 Update Reports Router

**File:** `backend/app/routes/reports_router.py`

```python
@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    specialist: str = Form("general-physician"),
    language: str = Form("auto"),
):
    """Upload a medical report for comprehensive analysis."""
    
    # Validate file
    file_type = file.content_type or ""
    if not any(t in file_type for t in ["pdf", "image"]):
        raise HTTPException(400, "Only PDF and image files are supported")
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Process report
    result = await OCRService.process_medical_report(file_bytes, file_type)
    
    # Detect language if auto
    if language == "auto" and result.get("ocr_text"):
        language = OCRService.detect_report_language(result["ocr_text"])
    
    # Re-process with detected language if image
    if "image" in file_type and language != "eng":
        result = await OCRService.process_medical_report(file_bytes, file_type, lang=language)
    
    # Analyze extracted images
    if result.get("images_extracted", 0) > 0 and result.get("structured_data", {}).get("tables"):
        image_analyses = await ReportImageAnalyzer.analyze_all_images(
            result.get("images", [])
        )
        result["image_analyses"] = image_analyses
    
    # Upload to Supabase
    file_id = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    storage_url = await FileService.upload_file(file_bytes, file.filename, "medical-reports")
    
    # Save to database
    report_record = await DatabaseService.save_report_analysis(
        file_id=file_id,
        file_type=file_type,
        file_name=file.filename,
        storage_url=storage_url,
        ocr_text=result.get("ocr_text", ""),
        structured_data=result.get("structured_data", {}),
        ai_summary=result.get("ai_summary", ""),
        specialist=specialist,
    )
    
    return ReportUploadResponse(
        success=result.get("success", False),
        report_id=file_id,
        file_name=file.filename,
        report_type=result.get("report_type", "general"),
        ocr_text=result.get("ocr_text", ""),
        structured_data=result.get("structured_data", {}),
        tables_extracted=result.get("tables_extracted", 0),
        images_extracted=result.get("images_extracted", 0),
        abnormal_values=result.get("abnormal_values", []),
        ai_summary=result.get("ai_summary", ""),
        image_analyses=result.get("image_analyses", []),
        storage_url=storage_url,
    )
```

---

### PHASE 6: Frontend Enhancements

#### 6.1 Updated UploadReport Page

Add auto-detection of report type and display of image analyses:

```tsx
// In src/pages/UploadReport.tsx

// Auto-detect report type from OCR response
const [detectedType, setDetectedType] = useState<string>("");
const [abnormalValues, setAbnormalValues] = useState<any[]>([]);
const [imageAnalyses, setImageAnalyses] = useState<any[]>([]);

// Update upload handler
const handleUpload = async () => {
  if (!selectedFile) { setError("Please select a file first"); return }
  setIsUploading(true); setError(null)
  
  try {
    const result = await api.reports.upload(selectedFile, selectedSpecialist)
    setDetectedType(result.report_type)
    setAbnormalValues(result.abnormal_values || [])
    setImageAnalyses(result.image_analyses || [])
    navigate(`/analysis/report/${result.report_id}`, {
      state: {
        reportType: result.report_type,
        abnormalValues: result.abnormal_values,
        imageAnalyses: result.image_analyses,
        aiSummary: result.ai_summary,
      }
    })
  } catch (err: any) { 
    setError(err.message || "Upload failed") 
  } finally { 
    setIsUploading(false) 
  }
}
```

#### 6.2 Abnormal Values Highlight Component

```tsx
// src/components/AbnormalValuesAlert.tsx
export default function AbnormalValuesAlert({ values }: { values: any[] }) {
  if (!values.length) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
        ⚠️ {values.length} Abnormal Value{values.length > 1 ? 's' : ''} Detected
      </h3>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
            <div>
              <span className="font-semibold text-slate-900">{v.test}</span>
              <span className="ml-2 text-sm text-slate-600">= {v.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                v.status === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {v.status === 'high' ? '↑ HIGH' : '↓ LOW'}
              </span>
              <span className="text-xs text-slate-500">Ref: {v.ref_range}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 📊 Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Enhanced OCR with AI summary | 3 hours | High |
| 🔴 P0 | Auto-detect report type | 1 hour | High |
| 🔴 P0 | Abnormal value highlighting | 2 hours | High |
| 🟡 P1 | PDF image extraction | 4 hours | Medium |
| 🟡 P1 | PDF table extraction | 3 hours | High |
| 🟡 P1 | Image analysis with Gemini Vision | 3 hours | Medium |
| 🟢 P2 | Multi-language OCR (Urdu/Hindi) | 3 hours | Medium |
| 🟢 P2 | Handwritten text detection | 6 hours | Low |
| 🟢 P2 | Trend analysis (compare reports) | 8 hours | Medium |

**Total estimated effort: 33 hours**

---

## 📦 Dependencies to Add

```txt
# Add to backend/requirements.txt
PyMuPDF>=1.23.0          # PDF image and table extraction (fitz)
```

---

## 🧪 Testing Checklist

- [ ] PDF with embedded tables → Tables extracted correctly
- [ ] PDF with images → Images extracted and classified
- [ ] Image of lab report → Text extracted via OCR
- [ ] Mixed English/Urdu report → Both languages extracted
- [ ] Handwritten notes → Detected and flagged
- [ ] Abnormal values → Highlighted in results
- [ ] Report type auto-detection → Correct type identified
- [ ] AI summary generated → Concise and accurate
- [ ] ECG image in PDF → Analyzed by Gemini Vision
- [ ] Blood chart in PDF → Trend analysis provided

---

## 🔧 Environment Variables Required

```env
# OCR Configuration
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Windows
# Or for Linux: tesseract (in PATH)

# Language support
SUPPORTED_OCR_LANGUAGES=eng,urd,hin
DEFAULT_OCR_LANGUAGE=eng

# Gemini Vision
GEMINI_VISION_MODEL=gemini-2.0-flash
```

---

## 📚 References

- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/)
- [pdfplumber Documentation](https://github.com/jsvine/pdfplumber)
- [Tesseract OCR Languages](https://github.com/tesseract-ocr/tessdata)
- [Gemini Vision API](https://ai.google.dev/gemini-api/docs/vision)
- [OpenCV Medical Image Analysis](https://docs.opencv.org/)
