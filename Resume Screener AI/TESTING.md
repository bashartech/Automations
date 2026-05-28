# Testing Checklist

## Pre-Testing Setup

- [x] Backend server running on port 8001
- [x] Frontend server running on port 3000
- [ ] Gemini API key configured in backend/.env
- [x] Both servers accessible

## Backend API Tests

### 1. Health Check
```bash
curl http://localhost:8001/api/health
```
**Expected:** `{"status":"healthy"}`

### 2. Root Endpoint
```bash
curl http://localhost:8001/
```
**Expected:** `{"message":"Resume Screener AI API","status":"running"}`

### 3. API Documentation
- Open: http://localhost:8001/docs
- **Expected:** Swagger UI with all endpoints listed

### 4. Extract Skills (requires API key)
```bash
curl -X POST http://localhost:8001/api/extract-skills \
  -H "Content-Type: application/json" \
  -d '{"text":"Software Engineer with Python, React, and AWS experience"}'
```
**Expected:** JSON with skills array

### 5. Match Resume (requires API key)
```bash
curl -X POST http://localhost:8001/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text":"Software Engineer with Python and React",
    "job_description":"Looking for Python and React developer"
  }'
```
**Expected:** JSON with match_percentage, matched_skills, missing_skills

## Frontend UI Tests

### 1. Page Load
- [ ] Open http://localhost:3000
- [ ] Page loads without errors
- [ ] Header displays "Resume Screener AI"
- [ ] Two textareas visible (Resume Text, Job Description)
- [ ] "Analyze Match" and "Reset" buttons visible

### 2. Input Validation
- [ ] Click "Analyze Match" with empty fields
- [ ] Error message appears: "Please provide both resume text and job description"

### 3. Resume Analysis (requires API key)
- [ ] Paste sample resume text
- [ ] Paste sample job description
- [ ] Click "Analyze Match"
- [ ] Button shows "Analyzing..." during processing
- [ ] Results appear with:
  - Match percentage (colored box)
  - Summary section
  - Matched skills (green badges)
  - Missing skills (red badges)

### 4. Reset Functionality
- [ ] Click "Reset" button
- [ ] Both textareas clear
- [ ] Results disappear
- [ ] No errors in console

### 5. Responsive Design
- [ ] Resize browser window
- [ ] Layout adapts to smaller screens
- [ ] Textareas stack vertically on mobile
- [ ] Buttons remain accessible

### 6. Error Handling
- [ ] Stop backend server
- [ ] Try to analyze
- [ ] Error message displays with connection error
- [ ] Restart backend and retry - should work

## Integration Tests

### 1. End-to-End Flow
- [ ] Start with clean state
- [ ] Enter resume text
- [ ] Enter job description
- [ ] Submit for analysis
- [ ] Verify results match expectations
- [ ] Reset and repeat with different data

### 2. Multiple Analyses
- [ ] Perform first analysis
- [ ] Without resetting, modify text
- [ ] Perform second analysis
- [ ] Verify new results replace old ones

### 3. API Key Validation
- [ ] With invalid API key: Error message appears
- [ ] With valid API key: Results appear correctly

## Performance Tests

- [ ] Large resume text (5000+ words) - should process
- [ ] Multiple rapid submissions - should handle gracefully
- [ ] Network latency simulation - loading state works

## Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

## Known Limitations to Verify

- [ ] File upload not yet implemented (expected)
- [ ] OCR not available (expected with Python 3.14)
- [ ] Without API key, AI features show error (expected)

## Test Results Summary

**Date:** ___________
**Tester:** ___________

**Backend Status:** ✅ / ❌
**Frontend Status:** ✅ / ❌
**Integration Status:** ✅ / ❌

**Issues Found:**
1. 
2. 
3. 

**Notes:**
