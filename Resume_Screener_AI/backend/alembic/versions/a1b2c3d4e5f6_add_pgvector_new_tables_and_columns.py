"""Add pgvector, new tables (companies, jobs, etc.) and columns

Revision ID: a1b2c3d4e5f6
Revises: cb5c7cfa0b27
Create Date: 2026-07-29 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "cb5c7cfa0b27"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── pgvector extension ────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Note: ENUM types use TEXT columns with Python-level validation
    # (avoids PostgreSQL enum migration issues when adding new values)

    # ── New Tables ────────────────────────────────────

    # companies
    op.create_table(
        "companies",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("industry", sa.String(255), nullable=True),
        sa.Column("company_size", sa.String(50), nullable=True),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=True, server_default="UTC"),
        sa.Column("default_language", sa.String(50), nullable=True, server_default="en"),
        sa.Column("hr_email", sa.String(255), nullable=True),
        sa.Column("contact_number", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # departments
    op.create_table(
        "departments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # jobs
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("department_id", sa.String(36), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("employment_type", sa.String(50), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("remote_type", sa.String(50), nullable=True),
        sa.Column("experience_required", sa.String(50), nullable=True),
        sa.Column("salary_min", sa.Float(), nullable=True),
        sa.Column("salary_max", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), nullable=True, server_default="USD"),
        sa.Column("num_openings", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("application_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("required_skills", sa.JSON(), nullable=True),
        sa.Column("preferred_skills", sa.JSON(), nullable=True),
        sa.Column("responsibilities", sa.JSON(), nullable=True),
        sa.Column("qualifications", sa.JSON(), nullable=True),
        sa.Column("benefits", sa.JSON(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(50), nullable=False, server_default="DRAFT",
        ),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # company_knowledge
    op.create_table(
        "company_knowledge",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("mission", sa.Text(), nullable=True),
        sa.Column("vision", sa.Text(), nullable=True),
        sa.Column("culture", sa.Text(), nullable=True),
        sa.Column("core_values", sa.JSON(), nullable=True),
        sa.Column("work_environment", sa.Text(), nullable=True),
        sa.Column("remote_policy", sa.Text(), nullable=True),
        sa.Column("working_hours", sa.String(100), nullable=True),
        sa.Column("interview_process", sa.Text(), nullable=True),
        sa.Column("interview_stages", sa.JSON(), nullable=True),
        sa.Column("hiring_policy", sa.Text(), nullable=True),
        sa.Column("required_documents", sa.JSON(), nullable=True),
        sa.Column("preferred_skills", sa.JSON(), nullable=True),
        sa.Column("communication_style", sa.Text(), nullable=True),
        sa.Column("interview_days", sa.JSON(), nullable=True),
        sa.Column("interview_time_slots", sa.JSON(), nullable=True),
        sa.Column("meeting_duration", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("timezone", sa.String(50), nullable=True, server_default="UTC"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # email_templates
    op.create_table(
        "email_templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # uploaded_documents
    op.create_table(
        "uploaded_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(50), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("embedding", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # interviews
    op.create_table(
        "interviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=True),
        sa.Column("candidate_id", sa.String(36), sa.ForeignKey("candidate_profiles.id"), nullable=False),
        sa.Column("date", sa.String(50), nullable=False),
        sa.Column("time", sa.String(50), nullable=False),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("meeting_link", sa.String(500), nullable=True),
        sa.Column("interviewer", sa.String(255), nullable=True),
        sa.Column("interview_round", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "status",
            sa.String(50), nullable=False, server_default="SCHEDULED",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # interview_slots
    op.create_table(
        "interview_slots",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(10), nullable=False),
        sa.Column("end_time", sa.String(10), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "type", sa.String(50), nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("link", sa.String(500), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # activity_logs
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # candidate_scores
    op.create_table(
        "candidate_scores",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("candidate_id", sa.String(36), sa.ForeignKey("candidate_profiles.id"), nullable=False, index=True),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=False, index=True),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("technical_score", sa.Float(), nullable=True),
        sa.Column("experience_score", sa.Float(), nullable=True),
        sa.Column("skill_match_score", sa.Float(), nullable=True),
        sa.Column("education_score", sa.Float(), nullable=True),
        sa.Column("project_score", sa.Float(), nullable=True),
        sa.Column("culture_fit_score", sa.Float(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("missing_skills", sa.JSON(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=True),
        sa.Column("weaknesses", sa.JSON(), nullable=True),
        sa.Column("risks", sa.JSON(), nullable=True),
        sa.Column("ai_recommendation", sa.String(50), nullable=True),
        sa.Column("ai_explanation", sa.Text(), nullable=True),
        sa.Column("hybrid_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("candidate_id", "job_id", name="uq_candidate_job_score"),
    )

    # ── Modify Existing Tables ────────────────────────

    # users: add company_id + role
    op.add_column("users", sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True, index=True))
    op.add_column("users", sa.Column(
        "role", sa.String(50), nullable=True, server_default="COMPANY_ADMIN",
    ))

    # candidate_profiles: add new columns
    op.add_column("candidate_profiles", sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True, index=True))
    op.add_column("candidate_profiles", sa.Column("portfolio_url", sa.String(500), nullable=True))
    op.add_column("candidate_profiles", sa.Column("website_url", sa.String(500), nullable=True))
    op.add_column("candidate_profiles", sa.Column("languages", sa.JSON(), nullable=True))
    op.add_column("candidate_profiles", sa.Column("achievements", sa.JSON(), nullable=True))
    op.add_column("candidate_profiles", sa.Column("resume_file_path", sa.String(500), nullable=True))
    op.add_column("candidate_profiles", sa.Column("quality_flags", sa.JSON(), nullable=True))

    # processing_jobs: add company_id, job_id, quality_failed_files
    op.add_column("processing_jobs", sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True, index=True))
    op.add_column("processing_jobs", sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=True))
    op.add_column("processing_jobs", sa.Column("quality_failed_files", sa.Integer(), nullable=False, server_default="0"))

    # candidate_duplicates: add method
    op.add_column("candidate_duplicates", sa.Column("method", sa.String(50), nullable=True))

    # scoring_weights: add company_id
    op.add_column("scoring_weights", sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True))

    # Note: indexes on candidate_scores are created via index=True in column definitions


def downgrade() -> None:
    # Drop new tables (reverse order of dependencies)
    op.drop_table("candidate_scores")
    op.drop_table("activity_logs")
    op.drop_table("notifications")
    op.drop_table("interview_slots")
    op.drop_table("interviews")
    op.drop_table("uploaded_documents")
    op.drop_table("email_templates")
    op.drop_table("company_knowledge")
    op.drop_table("jobs")
    op.drop_table("departments")
    op.drop_table("companies")

    # Remove columns from existing tables
    op.drop_column("scoring_weights", "company_id")
    op.drop_column("candidate_duplicates", "method")
    op.drop_column("processing_jobs", "quality_failed_files")
    op.drop_column("processing_jobs", "job_id")
    op.drop_column("processing_jobs", "company_id")
    op.drop_column("candidate_profiles", "quality_flags")
    op.drop_column("candidate_profiles", "resume_file_path")
    op.drop_column("candidate_profiles", "achievements")
    op.drop_column("candidate_profiles", "languages")
    op.drop_column("candidate_profiles", "website_url")
    op.drop_column("candidate_profiles", "portfolio_url")
    op.drop_column("candidate_profiles", "company_id")
    op.drop_column("users", "role")
    op.drop_column("users", "company_id")

    # Note: No enum types to drop — using TEXT columns with Python-level validation
