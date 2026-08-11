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
    portfolio_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    resume_file_path: Optional[str] = None
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
    portfolio_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    avatar_url: Optional[str] = None
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


class ScoreBreakdownV2(BaseModel):
    overall_score: float = 0
    technical_score: float = 0
    experience_score: float = 0
    skill_match_score: float = 0
    education_score: float = 0
    project_score: float = 0
    culture_fit_score: float = 0
    confidence_score: float = 0


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


class AnalyzeResponseV2(BaseModel):
    candidate_id: str
    job_id: str
    candidate_name: Optional[str] = None
    scores: ScoreBreakdownV2
    missing_skills: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    risks: List[str] = []
    recommendation: str = ""
    explanation: str = ""
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
    total_jobs: int = 0
    total_candidates: int = 0
    total_interviews: int = 0
    total_rejected: int = 0
    total_selected: int = 0
    avg_processing_time_seconds: float = 0
    top_skills: List[str] = []
    funnel: Dict[str, int] = {}


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
    role: Optional[str] = None
    company_id: Optional[str] = None
    created_at: datetime


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = "UTC"
    default_language: Optional[str] = "en"
    hr_email: Optional[str] = None
    contact_number: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    default_language: Optional[str] = None
    hr_email: Optional[str] = None
    contact_number: Optional[str] = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    default_language: Optional[str] = None
    hr_email: Optional[str] = None
    contact_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class DepartmentResponse(BaseModel):
    id: str
    company_id: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


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


class CompanyKnowledgeUpdate(BaseModel):
    mission: Optional[str] = None
    vision: Optional[str] = None
    culture: Optional[str] = None
    core_values: Optional[List[str]] = None
    work_environment: Optional[str] = None
    remote_policy: Optional[str] = None
    working_hours: Optional[str] = None
    interview_process: Optional[str] = None
    interview_stages: Optional[List[str]] = None
    hiring_policy: Optional[str] = None
    required_documents: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    communication_style: Optional[str] = None
    interview_days: Optional[List[int]] = None
    interview_time_slots: Optional[List[str]] = None
    meeting_duration: Optional[int] = None
    timezone: Optional[str] = None


class CompanyKnowledgeResponse(CompanyKnowledgeUpdate):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailTemplateCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)


class EmailTemplateUpdate(BaseModel):
    type: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class EmailTemplateResponse(BaseModel):
    id: str
    company_id: str
    type: str
    subject: str
    body: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UploadedDocumentResponse(BaseModel):
    id: str
    company_id: str
    filename: str
    original_name: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeExtractResponse(BaseModel):
    knowledge: CompanyKnowledgeResponse
    document_id: str
    message: str = "Knowledge extracted successfully"


class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    department_id: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    remote_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "USD"
    num_openings: int = 1
    application_deadline: Optional[datetime] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    description: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    remote_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    num_openings: Optional[int] = None
    application_deadline: Optional[datetime] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    description: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    company_id: str
    department_id: Optional[str] = None
    title: str
    employment_type: Optional[str] = None
    location: Optional[str] = None
    remote_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    num_openings: int = 1
    application_deadline: Optional[datetime] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    description: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Phase 7: Notifications & Activity Logs ──

class NotificationResponse(BaseModel):
    id: str
    company_id: str
    user_id: Optional[str] = None
    type: str
    title: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: str
    company_id: Optional[str] = None
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JDReviewResponse(BaseModel):
    suggestions: List[str] = []
    missing_skills: List[str] = []
    grammar_issues: List[str] = []
    inclusive_language_suggestions: List[str] = []
    recommendation: str = "revision"
    overall_quality_score: float = 0.0
    improved_description: str = ""


class JDReviewRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    required_skills: Optional[List[str]] = None


# ── Phase 6: Interview Scheduling ──

class InterviewSlotCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    is_available: bool = True


class InterviewSlotUpdate(BaseModel):
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    is_available: Optional[bool] = None


class InterviewSlotResponse(BaseModel):
    id: str
    company_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewCreate(BaseModel):
    job_id: Optional[str] = None
    candidate_id: str = Field(..., min_length=1)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM")
    timezone: str = "UTC"
    interviewer: Optional[str] = None
    interview_round: int = 1
    notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    timezone: Optional[str] = None
    interviewer: Optional[str] = None
    interview_round: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class InterviewResponse(BaseModel):
    id: str
    company_id: str
    job_id: Optional[str] = None
    candidate_id: str
    candidate_name: Optional[str] = None
    date: str
    time: str
    timezone: str
    meeting_link: Optional[str] = None
    interviewer: Optional[str] = None
    interview_round: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
