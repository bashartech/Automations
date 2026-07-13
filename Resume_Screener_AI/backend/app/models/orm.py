import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, DateTime, Enum as SAEnum, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits_remaining: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


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


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    resume_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    experience: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    education: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    certifications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    projects: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    category: Mapped[Optional[CandidateCategory]] = mapped_column(SAEnum(CandidateCategory), nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="new")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    status: Mapped[ProcessingStatus] = mapped_column(SAEnum(ProcessingStatus), default=ProcessingStatus.PENDING)
    total_files: Mapped[int] = mapped_column(Integer, default=0)
    processed_files: Mapped[int] = mapped_column(Integer, default=0)
    failed_files: Mapped[int] = mapped_column(Integer, default=0)
    job_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_paths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
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
    skill_weight: Mapped[float] = mapped_column(Float, default=40.0)
    experience_weight: Mapped[float] = mapped_column(Float, default=30.0)
    education_weight: Mapped[float] = mapped_column(Float, default=15.0)
    certification_weight: Mapped[float] = mapped_column(Float, default=10.0)
    project_weight: Mapped[float] = mapped_column(Float, default=5.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
