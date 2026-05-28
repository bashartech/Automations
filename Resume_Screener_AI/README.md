# Resume Screener AI

AI-powered resume screening and job matching system built with Next.js, FastAPI, and Gemini AI.

## Project Structure

```
resume-screener-ai/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # AI and OCR services
│   │   ├── models/       # Data models
│   │   └── main.py       # FastAPI app
│   ├── venv/
│   ├── requirements.txt
│   └── run.py
├── frontend/         # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Features

✅ **Implemented:**
- Resume text input
- Job description input
- AI-powered skill extraction
- Resume-to-job matching with percentage
- Matched and missing skills display
- Professional, responsive UI
- Real-time analysis

⚠️ **Pending:**
- File upload (PDF, DOCX, images)
- OCR text extraction (requires Python 3.11/3.12)
- Tesseract OCR integration

## Tech Stack

**Backend:**
- FastAPI (Python)
- OpenAI SDK (configured for Gemini API)
- Pydantic for data validation
- CORS enabled for frontend

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Responsive design

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   
   Get API key from: https://makersuite.google.com/app/apikey

5. **Run the server:**
   ```bash
   python run.py
   ```
   
   Backend will run on: http://localhost:8001

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will run on: http://localhost:3000

## Usage

1. **Start both servers:**
   - Backend: `python run.py` (port 8001)
   - Frontend: `npm run dev` (port 3000)

2. **Open browser:**
   - Navigate to http://localhost:3000

3. **Test the application:**
   - Paste resume text in the left textarea
   - Paste job description in the right textarea
   - Click "Analyze Match"
   - View results with match percentage, matched skills, and missing skills

## API Endpoints

### Health Check
```
GET http://localhost:8001/api/health
```

### Extract Skills
```
POST http://localhost:8001/api/extract-skills
Content-Type: application/json

{
  "text": "Resume text here"
}
```

### Match Resume to Job
```
POST http://localhost:8001/api/match
Content-Type: application/json

{
  "resume_text": "Resume text",
  "job_description": "Job description"
}
```

### API Documentation
Interactive API docs available at: http://localhost:8001/docs

## Testing

### Sample Resume Text
```
Software Engineer with 5 years of experience in Python, JavaScript, React, Node.js, and AWS. 
Strong background in building scalable web applications and RESTful APIs. 
Bachelor's degree in Computer Science from XYZ University.
Experience with Docker, Kubernetes, PostgreSQL, and MongoDB.
```

### Sample Job Description
```
We are looking for a Senior Software Engineer with expertise in:
- Python and FastAPI
- React and TypeScript
- AWS cloud services
- Docker and Kubernetes
- PostgreSQL database
- 5+ years of experience
- Bachelor's degree in Computer Science or related field
```

### Expected Results
- Match percentage: ~85-90%
- Matched skills: Python, React, AWS, Docker, Kubernetes, PostgreSQL, Computer Science degree
- Missing skills: FastAPI, TypeScript

## Known Issues

### Python 3.14 Compatibility
- Pillow and pydantic-core don't have prebuilt wheels for Python 3.14
- OCR functionality temporarily disabled
- **Recommended:** Use Python 3.11 or 3.12 for full OCR support

### Tesseract OCR
- Not installed by default
- Required for image-based resume processing
- See `backend/TESSERACT_INSTALL.md` for installation instructions

## Future Enhancements

- [ ] File upload support (PDF, DOCX, images)
- [ ] OCR integration for scanned resumes
- [ ] Batch processing multiple resumes
- [ ] Export results to PDF/CSV
- [ ] Resume scoring history
- [ ] User authentication
- [ ] Database integration
- [ ] Advanced filtering and search

## Troubleshooting

### Backend won't start
- Check if port 8001 is available
- Verify virtual environment is activated
- Ensure all dependencies are installed

### Frontend won't start
- Check if port 3000 is available
- Run `npm install` to ensure dependencies are installed
- Clear `.next` folder and restart

### API errors
- Verify Gemini API key is valid and set in `.env`
- Check backend logs for detailed error messages
- Ensure CORS is properly configured

### No results showing
- Check browser console for errors
- Verify backend is running on port 8001
- Check network tab for API call responses

## License

MIT

## Support

For issues and questions, please check the documentation or create an issue in the repository.
