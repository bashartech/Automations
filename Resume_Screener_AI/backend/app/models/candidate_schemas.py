from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.orm import CandidateCategory, ProcessingStatus, DuplicateStatus


class CandidateProfileResponse(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    category: Optional[CandidateCategory] = None
    overall_score: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ProfileExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw resume text to extract structured profile from")
    resume_id: Optional[str] = None


class ProfileExtractResponse(BaseModel):
    profile: CandidateProfileResponse
    message: str = "Profile extracted successfully"


class AnalyzeRequest(BaseModel):
    resume_id: str = Field(..., description="ID of the candidate profile to analyze")
    job_description: str = Field(..., min_length=1, description="Job description to analyze against")


class ScoreBreakdown(BaseModel):
    skills_score: float = 0
    experience_score: float = 0
    education_score: float = 0
    certification_score: float = 0
    project_score: float = 0
    overall_score: float = 0


class AnalyzeResponse(BaseModel):
    candidate_name: Optional[str] = None
    overall_score: float
    scores: ScoreBreakdown
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_requirements: List[str] = []
    recommendation: str = ""
    summary: str = ""
    category: CandidateCategory


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")


class SearchResult(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    summary: Optional[str] = None
    category: Optional[CandidateCategory] = None
    overall_score: Optional[float] = None
    relevance_score: float = 0


class SearchResponse(BaseModel):
    results: List[SearchResult] = []


class BulkUploadResponse(BaseModel):
    job_id: str
    total_files: int
    message: str = "Bulk upload started"
    skipped_files: List[str] = []
    skipped_count: int = 0


class ProcessingJobResponse(BaseModel):
    id: str
    status: ProcessingStatus
    total_files: int
    processed_files: int
    failed_files: int
    job_description: Optional[str] = None
    file_paths: Optional[List[str]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class DashboardMetrics(BaseModel):
    total_resumes: int = 0
    processed_resumes: int = 0
    strong_matches: int = 0
    duplicate_candidates: int = 0
    average_match_score: float = 0
    category_distribution: Dict[str, int] = {}


class WeightsUpdate(BaseModel):
    skill_weight: Optional[float] = None
    experience_weight: Optional[float] = None
    education_weight: Optional[float] = None
    certification_weight: Optional[float] = None
    project_weight: Optional[float] = None


class WeightsResponse(BaseModel):
    skill_weight: float
    experience_weight: float
    education_weight: float
    certification_weight: float
    project_weight: float


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=255)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: datetime


class DuplicateReviewRequest(BaseModel):
    action: DuplicateStatus = Field(..., description="Action: merged, ignored, or different_person")


class BulkActionRequest(BaseModel):
    ids: List[str] = Field(..., min_length=1, description="List of candidate profile IDs")


class CompareRequest(BaseModel):
    ids: List[str] = Field(..., min_length=2, max_length=5, description="2-5 candidate IDs to compare")


class CreditPackResponse(BaseModel):
    id: str
    name: str
    price_cents: int
    credits: int
    active: bool

    class Config:
        from_attributes = True


class CreditBalanceResponse(BaseModel):
    credits_remaining: int


class CreditTransactionResponse(BaseModel):
    id: str
    amount: int
    reason: str
    stripe_session_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CreateCheckoutRequest(BaseModel):
    pack_id: str


class CreateCheckoutResponse(BaseModel):
    url: str
    credits_added: int
    success: bool
    mock: bool = True
