import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


class TestResumeDownload:
    @pytest.mark.asyncio
    async def test_download_success(self):
        from app.routers.candidates import download_resume
        from app.repositories.candidate_repository import CandidateRepository
        from app.database import AsyncSession
        from app.models.orm import CandidateProfile

        mock_db = AsyncMock(spec=AsyncSession)
        mock_user = MagicMock()
        mock_user.id = "u1"

        profile = CandidateProfile(
            id="p1", name="Alice", resume_file_path=__file__,  # mock with this file
        )

        with patch.object(CandidateRepository, "get_profile", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = profile
            resp = await download_resume("p1", db=mock_db, current_user=mock_user)
            assert resp.path == __file__

    @pytest.mark.asyncio
    async def test_download_not_found(self):
        from app.routers.candidates import download_resume
        from app.repositories.candidate_repository import CandidateRepository
        from app.database import AsyncSession

        mock_db = AsyncMock(spec=AsyncSession)
        mock_user = MagicMock()
        mock_user.id = "u1"

        with patch.object(CandidateRepository, "get_profile", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            with pytest.raises(HTTPException) as exc:
                await download_resume("p1", db=mock_db, current_user=mock_user)
            assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_download_no_file_path(self):
        from app.routers.candidates import download_resume
        from app.repositories.candidate_repository import CandidateRepository
        from app.database import AsyncSession
        from app.models.orm import CandidateProfile

        mock_db = AsyncMock(spec=AsyncSession)
        mock_user = MagicMock()
        mock_user.id = "u1"

        profile = CandidateProfile(id="p1", name="Alice", resume_file_path=None)

        with patch.object(CandidateRepository, "get_profile", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = profile
            with pytest.raises(HTTPException) as exc:
                await download_resume("p1", db=mock_db, current_user=mock_user)
            assert exc.value.status_code == 404
            assert "No resume file" in exc.value.detail

    @pytest.mark.asyncio
    async def test_download_file_missing_on_disk(self):
        from app.routers.candidates import download_resume
        from app.repositories.candidate_repository import CandidateRepository
        from app.database import AsyncSession
        from app.models.orm import CandidateProfile

        mock_db = AsyncMock(spec=AsyncSession)
        mock_user = MagicMock()
        mock_user.id = "u1"

        profile = CandidateProfile(id="p1", name="Alice", resume_file_path="/nonexistent/path.pdf")

        with patch.object(CandidateRepository, "get_profile", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = profile
            with pytest.raises(HTTPException) as exc:
                await download_resume("p1", db=mock_db, current_user=mock_user)
            assert exc.value.status_code == 404
            assert "not found on disk" in exc.value.detail
