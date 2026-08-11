import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Float, DateTime, Enum as SAEnum, ForeignKey, JSON, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


def new_uuid():
    return str(uuid.uuid4())


# ── Enums ──────────────────────────────────────────────

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    HR_RECRUITER = "hr_recruiter"
    HIRING_MANAGER = "hiring_manager"


class CandidateCategory(str, enum.Enum):
    STRONG_MATCH = "strong_match"
    GOOD_MATCH = "good_match"
    AVERAGE_MATCH = "average_match"
    WEAK_MATCH = "weak_match"
    REJECT = "reject"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DuplicateStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"
    MERGED = "merged"
    IGNORED = "ignored"
    DIFFERENT_PERSON = "different_person"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    CLOSED = "closed"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class NotificationType(str, enum.Enum):
    PROCESSING_COMPLETE = "processing_complete"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    CANDIDATE_STATUS_UPDATED = "candidate_status_updated"
    SYSTEM_ERROR = "system_error"


# ── Existing Tables (Modified) ─────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits_remaining: Mapped[int] = mapped_column(Integer, default=0)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    role: Mapped[Optional[UserRole]] = mapped_column(SAEnum(UserRole), nullable=True, default=UserRole.COMPANY_ADMIN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    resume_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    experience: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    education: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    certifications: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    projects: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    languages: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    achievements: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[Optional[CandidateCategory]] = mapped_column(SAEnum(CandidateCategory), nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="new")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quality_flags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    job_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("jobs.id"), nullable=True)
    status: Mapped[ProcessingStatus] = mapped_column(SAEnum(ProcessingStatus), default=ProcessingStatus.PENDING)
    total_files: Mapped[int] = mapped_column(Integer, default=0)
    processed_files: Mapped[int] = mapped_column(Integer, default=0)
    failed_files: Mapped[int] = mapped_column(Integer, default=0)
    quality_failed_files: Mapped[int] = mapped_column(Integer, default=0)
    job_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_paths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    raw_texts: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CandidateDuplicate(Base):
    __tablename__ = "candidate_duplicates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    candidate_id_1: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id"), index=True)
    candidate_id_2: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id"), index=True)
    similarity: Mapped[float] = mapped_column(Float, default=0.0)
    duplicate_status: Mapped[DuplicateStatus] = mapped_column(SAEnum(DuplicateStatus), default=DuplicateStatus.PENDING_REVIEW)
    method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CreditPack(Base):
    __tablename__ = "credit_packs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, default=0)
    credits: Mapped[int] = mapped_column(Integer, default=0)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    stripe_session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ScoringWeight(Base):
    __tablename__ = "scoring_weights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True)
    skill_weight: Mapped[float] = mapped_column(Float, default=40.0)
    experience_weight: Mapped[float] = mapped_column(Float, default=30.0)
    education_weight: Mapped[float] = mapped_column(Float, default=15.0)
    certification_weight: Mapped[float] = mapped_column(Float, default=10.0)
    project_weight: Mapped[float] = mapped_column(Float, default=5.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ── New Tables (Phase 1+) ──────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="UTC")
    default_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="en")
    hr_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    employment_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    remote_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    experience_required: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="USD")
    num_openings: Mapped[int] = mapped_column(Integer, default=1)
    application_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    required_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    preferred_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    responsibilities: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    qualifications: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    benefits: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.DRAFT)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CompanyKnowledge(Base):
    __tablename__ = "company_knowledge"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)

    mission: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vision: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    culture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    core_values: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    work_environment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    remote_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    working_hours: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    interview_process: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interview_stages: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    hiring_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_documents: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    preferred_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    communication_style: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    interview_days: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    interview_time_slots: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    meeting_duration: Mapped[int] = mapped_column(Integer, default=60)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="UTC")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    job_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("jobs.id"), nullable=True)
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id"), nullable=False)
    date: Mapped[str] = mapped_column(String(50), nullable=False)
    time: Mapped[str] = mapped_column(String(50), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="UTC")
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    interviewer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    interview_round: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[InterviewStatus] = mapped_column(SAEnum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InterviewSlot(Base):
    __tablename__ = "interview_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id"), nullable=False, index=True)
    job_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)

    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    technical_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    experience_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skill_match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    education_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    project_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    culture_fit_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    missing_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    strengths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    risks: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    ai_recommendation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ai_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hybrid_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("candidate_id", "job_id", name="uq_candidate_job_score"),
    )


class FailedTask(Base):
    __tablename__ = "failed_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    task_name: Mapped[str] = mapped_column(String(255), nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    traceback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TaskLog(Base):
    __tablename__ = "task_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    task_name: Mapped[str] = mapped_column(String(255), nullable=False)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GoogleToken(Base):
    __tablename__ = "google_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True, unique=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_uri: Mapped[str] = mapped_column(String(255), nullable=False)
    client_id: Mapped[str] = mapped_column(String(255), nullable=False)
    client_secret: Mapped[str] = mapped_column(String(255), nullable=False)
    scopes: Mapped[str] = mapped_column(Text, nullable=False)
    expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
