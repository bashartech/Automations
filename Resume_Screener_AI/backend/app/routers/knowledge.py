import uuid
import os
import io
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.orm import CompanyKnowledge, EmailTemplate, UploadedDocument, UserRole
from app.models.candidate_schemas import (
    CompanyKnowledgeUpdate, CompanyKnowledgeResponse,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse,
    UploadedDocumentResponse, KnowledgeExtractResponse,
)
from app.dependencies import get_current_user, require_role, require_company_access
from app.services.knowledge_service import KnowledgeAgent
from app.services.embedding_service import GeminiEmbeddingService
from app.routers.upload import extract_text_from_pdf, extract_text_from_docx, extract_text_from_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/companies", tags=["knowledge"])
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx", ".txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


async def _get_knowledge(db: AsyncSession, company_id: str) -> CompanyKnowledge | None:
    result = await db.execute(
        select(CompanyKnowledge).where(CompanyKnowledge.company_id == company_id)
    )
    return result.scalar_one_or_none()


async def _ensure_knowledge(db: AsyncSession, company_id: str) -> CompanyKnowledge:
    record = await _get_knowledge(db, company_id)
    if record:
        return record
    record = CompanyKnowledge(id=str(uuid.uuid4()), company_id=company_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


# ── Company Knowledge ─────────────────────────────────


@router.get("/{company_id}/knowledge", response_model=CompanyKnowledgeResponse)
async def get_company_knowledge(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    record = await _get_knowledge(db, company_id)
    if not record:
        raise HTTPException(status_code=404, detail="Company knowledge not found. Use PUT to create.")
    return CompanyKnowledgeResponse.model_validate(record)


@router.put("/{company_id}/knowledge", response_model=CompanyKnowledgeResponse)
async def upsert_company_knowledge(
    company_id: str,
    request: CompanyKnowledgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    record = await _ensure_knowledge(db, company_id)
    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        for field, value in update_data.items():
            setattr(record, field, value)
        await db.commit()
        await db.refresh(record)

    return CompanyKnowledgeResponse.model_validate(record)


@router.post("/{company_id}/knowledge/extract", response_model=KnowledgeExtractResponse)
async def extract_knowledge_from_document(
    company_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.HR_RECRUITER, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 20MB.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    try:
        if file_ext == ".pdf":
            text = await extract_text_from_pdf(content, file.filename)
        elif file_ext in (".png", ".jpg", ".jpeg"):
            text = await extract_text_from_image(content)
        elif file_ext == ".docx":
            text = await extract_text_from_docx(content)
        else:
            text = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Text extraction failed: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    # Store uploaded document
    import aiofiles
    doc_path = UPLOAD_DIR / f"{uuid.uuid4()}{file_ext}"
    async with aiofiles.open(str(doc_path), "wb") as f:
        await f.write(content)

    doc = UploadedDocument(
        id=str(uuid.uuid4()),
        company_id=company_id,
        filename=doc_path.name,
        original_name=file.filename,
        file_type=file_ext.lstrip("."),
        extracted_text=text,
    )

    # Generate embedding for the document
    try:
        embedder = GeminiEmbeddingService()
        embedding = await embedder.embed_text(text[:30000])
        doc.embedding = embedding
    except Exception as e:
        logger.warning("Embedding generation failed for knowledge doc: %s", e)

    db.add(doc)

    # AI extraction
    agent = KnowledgeAgent()
    extracted = await agent.extract_from_document(text)

    # Upsert knowledge record
    record = await _ensure_knowledge(db, company_id)
    for field, value in extracted.items():
        if value is not None:
            setattr(record, field, value)

    await db.commit()
    await db.refresh(record)

    return KnowledgeExtractResponse(
        knowledge=CompanyKnowledgeResponse.model_validate(record),
        document_id=doc.id,
    )


# ── Email Templates ────────────────────────────────────


@router.get("/{company_id}/email-templates", response_model=list[EmailTemplateResponse])
async def list_email_templates(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(EmailTemplate)
        .where(EmailTemplate.company_id == company_id)
        .order_by(EmailTemplate.type)
    )
    return [EmailTemplateResponse.model_validate(row) for row in result.scalars().all()]


@router.post("/{company_id}/email-templates", response_model=EmailTemplateResponse, status_code=201)
async def create_email_template(
    company_id: str,
    request: EmailTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    template = EmailTemplate(
        id=str(uuid.uuid4()),
        company_id=company_id,
        type=request.type,
        subject=request.subject,
        body=request.body,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return EmailTemplateResponse.model_validate(template)


@router.patch("/{company_id}/email-templates/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    company_id: str,
    template_id: str,
    request: EmailTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.company_id == company_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")

    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        for field, value in update_data.items():
            setattr(template, field, value)
        await db.commit()
        await db.refresh(template)

    return EmailTemplateResponse.model_validate(template)


@router.delete("/{company_id}/email-templates/{template_id}", status_code=204)
async def delete_email_template(
    company_id: str,
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.company_id == company_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")

    await db.delete(template)
    await db.commit()


# ── Uploaded Documents ──────────────────────────────────


@router.get("/{company_id}/documents", response_model=list[UploadedDocumentResponse])
async def list_uploaded_documents(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.company_id == company_id)
        .order_by(UploadedDocument.created_at.desc())
    )
    return [UploadedDocumentResponse.model_validate(row) for row in result.scalars().all()]


@router.delete("/{company_id}/documents/{document_id}", status_code=204)
async def delete_uploaded_document(
    company_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserRole = Depends(require_role(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)),
):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(UploadedDocument).where(
            UploadedDocument.id == document_id,
            UploadedDocument.company_id == company_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    file_path = UPLOAD_DIR / doc.filename
    if file_path.exists():
        os.remove(file_path)

    await db.delete(doc)
    await db.commit()
