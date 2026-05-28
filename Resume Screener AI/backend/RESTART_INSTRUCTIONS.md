# Backend Restart Instructions

## The Problem
The backend server is running old cached Python bytecode. The `/api/upload` endpoint exists in the code but not in the running server.

## Solution: Clean Restart

### Step 1: Stop the Backend
In your backend terminal, press `Ctrl+C` to stop the server.

### Step 2: Clear Python Cache (Already Done)
✅ Cache cleared

### Step 3: Restart the Backend
```bash
cd "D:\DATA\Automations\Resume Screener AI\backend"
venv\Scripts\activate
python run.py
```

### Step 4: Verify the Endpoint
After restart, check if `/api/upload` is available:
```bash
curl http://localhost:8001/openapi.json | grep "upload"
```

You should see `/api/upload` (not `/api/upload-text`)

### Step 5: Test in Browser
1. Go to http://localhost:3000
2. Try uploading a PDF file
3. Should work without 404 error

## What Changed
- **Old endpoint**: `/api/upload-text` (text only)
- **New endpoint**: `/api/upload` (file upload with extraction)

The new endpoint supports:
- PDF files (PyPDF2)
- DOCX files (python-docx)
- Image files (requires OCR libraries)
