import os
import zipfile
import shutil
import uuid
import logging
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.candidate_repository import CandidateRepository
from app.models.orm import ProcessingJob, ProcessingStatus, User
from app.models.candidate_schemas import BulkUploadResponse, ProcessingJobResponse
from app.tasks.resume_processing_task import process_resume_file
from app.dependencies import get_current_user
from app.services.credit_service import has_sufficient_credits, get_credit_balance
from app.services.ocr_service import OCRService

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".txt"}

router = APIRouter(prefix="/api/resumes", tags=["bulk"])
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported for bulk upload")

    job_id = str(uuid.uuid4())
    extract_dir = UPLOAD_DIR / job_id
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        content = await file.read()
        zip_path = extract_dir / "upload.zip"
        with open(zip_path, "wb") as f:
            f.write(content)

        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        zip_path.unlink()

        file_paths = []
        skipped = []
        for root, _, files in os.walk(extract_dir):
            for fn in files:
                if fn.startswith("._"):
                    skipped.append(fn)
                    continue
                ext = os.path.splitext(fn)[1].lower()
                if ext in SUPPORTED_EXTENSIONS:
                    file_paths.append(str(Path(root) / fn))
                else:
                    skipped.append(fn)

        logger.info(
            "Bulk upload %s: detected %d files, skipped %d (unsupported/hidden)",
            job_id, len(file_paths), len(skipped),
        )
        if skipped:
            logger.debug("Skipped files: %s", skipped[:20])

        if not await has_sufficient_credits(db, current_user.id, len(file_paths)):
            shutil.rmtree(extract_dir, ignore_errors=True)
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits. Need {len(file_paths)} credits, you have {await get_credit_balance(db, current_user.id)}",
            )

        # Extract text from each file immediately and store in DB
        ocr = OCRService()
        raw_texts = {}
        for idx, fp in enumerate(file_paths):
            try:
                raw_texts[str(idx)] = ocr.extract_text(fp)
            except Exception as e:
                logger.warning("Failed to extract text for %s: %s", fp, e)
                raw_texts[str(idx)] = ""

        job = ProcessingJob(
            id=job_id,
            status=ProcessingStatus.PROCESSING,
            total_files=len(file_paths),
            job_description=job_description or None,
            file_paths=file_paths,
            raw_texts=raw_texts,
        )
        repo = CandidateRepository(db, current_user.id)
        await repo.create_processing_job(job)

        # Remove extracted files — Celery no longer needs them
        shutil.rmtree(extract_dir, ignore_errors=True)

        for idx in range(len(file_paths)):
            process_resume_file.delay(job_id, idx, job_description)

        return BulkUploadResponse(
            job_id=job_id,
            total_files=len(file_paths),
            skipped_files=skipped,
            skipped_count=len(skipped),
            message=f"Processing {len(file_paths)} files ({len(skipped)} skipped — unsupported formats)",
        )
    except Exception as e:
        shutil.rmtree(extract_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bulk-upload/{job_id}", response_model=ProcessingJobResponse)
async def get_bulk_status(job_id: str, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    repo = CandidateRepository(db, current_user.id)
    job = await repo.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return ProcessingJobResponse(
        id=job.id,
        status=job.status,
        total_files=job.total_files,
        processed_files=job.processed_files,
        failed_files=job.failed_files,
        job_description=job.job_description,
        file_paths=job.file_paths,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
    )


@router.post("/bulk-upload-files", response_model=BulkUploadResponse)
async def bulk_upload_files(
    files: List[UploadFile] = File(...),
    job_description: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job_id = str(uuid.uuid4())
    extract_dir = UPLOAD_DIR / job_id
    extract_dir.mkdir(parents=True, exist_ok=True)

    supported = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".txt"}
    file_paths = []
    skipped = []

    try:
        for f in files:
            if not f.filename:
                continue
            fn = f.filename
            if fn.startswith("._"):
                skipped.append(fn)
                continue
            ext = os.path.splitext(fn)[1].lower()
            if ext not in supported:
                skipped.append(fn)
                continue
            dest = extract_dir / fn
            dest.parent.mkdir(parents=True, exist_ok=True)
            content = await f.read()
            with open(dest, "wb") as out:
                out.write(content)
            file_paths.append(str(dest))

        logger.info(
            "Bulk upload files %s: detected %d files, skipped %d (unsupported/hidden)",
            job_id, len(file_paths), len(skipped),
        )

        if not await has_sufficient_credits(db, current_user.id, len(file_paths)):
            shutil.rmtree(extract_dir, ignore_errors=True)
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits. Need {len(file_paths)} credits, you have {await get_credit_balance(db, current_user.id)}",
            )

        # Extract text from each file immediately and store in DB
        ocr = OCRService()
        raw_texts = {}
        for idx, fp in enumerate(file_paths):
            try:
                raw_texts[str(idx)] = ocr.extract_text(fp)
            except Exception as e:
                logger.warning("Failed to extract text for %s: %s", fp, e)
                raw_texts[str(idx)] = ""

        job = ProcessingJob(
            id=job_id,
            status=ProcessingStatus.PROCESSING,
            total_files=len(file_paths),
            job_description=job_description or None,
            file_paths=file_paths,
            raw_texts=raw_texts,
        )
        repo = CandidateRepository(db, current_user.id)
        await repo.create_processing_job(job)

        # Remove extracted files — Celery no longer needs them
        shutil.rmtree(extract_dir, ignore_errors=True)

        for idx in range(len(file_paths)):
            process_resume_file.delay(job_id, idx, job_description)

        return BulkUploadResponse(
            job_id=job_id,
            total_files=len(file_paths),
            skipped_files=skipped,
            skipped_count=len(skipped),
            message=f"Processing {len(file_paths)} files ({len(skipped)} skipped — unsupported formats)",
        )
    except Exception as e:
        shutil.rmtree(extract_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))
