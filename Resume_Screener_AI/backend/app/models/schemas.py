from pydantic import BaseModel, Field
from typing import List, Optional

class SkillExtractRequest(BaseModel):
    text: str = Field(..., description="Resume text to extract skills from")

class SkillExtractResponse(BaseModel):
    skills: List[str] = Field(..., description="List of extracted skills")
    experience_years: Optional[int] = Field(None, description="Years of experience")
    education: Optional[str] = Field(None, description="Education background")

class MatchRequest(BaseModel):
    resume_text: str = Field(..., description="Resume text")
    job_description: str = Field(..., description="Job description")

class MatchResponse(BaseModel):
    match_percentage: float = Field(..., description="Match percentage (0-100)")
    matched_skills: List[str] = Field(..., description="Skills that match")
    missing_skills: List[str] = Field(..., description="Skills missing from resume")
    summary: str = Field(..., description="Match summary")

class UploadResponse(BaseModel):
    filename: str
    extracted_text: str
    message: str
