from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    SkillExtractRequest,
    SkillExtractResponse,
    MatchRequest,
    MatchResponse
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/api", tags=["analysis"])
ai_service = AIService()

@router.post("/extract-skills", response_model=SkillExtractResponse)
async def extract_skills(request: SkillExtractRequest):
    """Extract skills from resume text"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Resume text cannot be empty")

        result = ai_service.extract_skills(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match", response_model=MatchResponse)
async def match_resume(request: MatchRequest):
    """Match resume against job description"""
    try:
        if not request.resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text cannot be empty")
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")

        result = ai_service.match_resume_to_job(
            request.resume_text,
            request.job_description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
