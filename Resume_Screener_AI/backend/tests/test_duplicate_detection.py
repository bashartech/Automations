import pytest
import math
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List, Optional

from app.models.orm import CandidateProfile, CandidateDuplicate, DuplicateStatus


class TestCosineSimilarity:
    def test_identical_vectors(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        a = [1.0, 0.0, 0.0]
        assert DuplicateDetectionService._cosine_similarity(a, a) == 1.0

    def test_orthogonal_vectors(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert DuplicateDetectionService._cosine_similarity(a, b) == 0.0

    def test_partial_similarity(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        a = [1.0, 1.0]
        b = [1.0, 0.0]
        sim = DuplicateDetectionService._cosine_similarity(a, b)
        expected = 1.0 / math.sqrt(2)
        assert abs(sim - expected) < 1e-10

    def test_empty_vectors(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        assert DuplicateDetectionService._cosine_similarity([], []) == 0.0

    def test_zero_vector(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        a = [0.0, 0.0, 0.0]
        b = [1.0, 2.0, 3.0]
        assert DuplicateDetectionService._cosine_similarity(a, b) == 0.0

    def test_mismatched_length(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService
        a = [1.0, 0.0]
        b = [1.0, 0.0, 0.0]
        assert DuplicateDetectionService._cosine_similarity(a, b) == 0.0


class TestEmbeddingDuplicateDetection:
    @pytest.mark.asyncio
    async def test_check_embedding_no_embedding(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        svc = DuplicateDetectionService(mock_db)
        profile = MagicMock(spec=CandidateProfile)
        profile.embedding = None

        result = await svc.check_embedding(profile)
        assert result == []

    @pytest.mark.asyncio
    async def test_check_embedding_empty_embedding(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        svc = DuplicateDetectionService(mock_db)
        profile = MagicMock(spec=CandidateProfile)
        profile.embedding = []

        result = await svc.check_embedding(profile)
        assert result == []

    @pytest.mark.asyncio
    async def test_check_embedding_finds_match(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        other_profile = MagicMock(spec=CandidateProfile)
        other_profile.id = "p2"
        other_profile.embedding = [1.0, 0.0, 0.0, 0.0]
        mock_result.scalars.return_value.all.return_value = [other_profile]
        mock_db.execute.return_value = mock_result

        svc = DuplicateDetectionService(mock_db)
        profile = MagicMock(spec=CandidateProfile)
        profile.id = "p1"
        profile.embedding = [1.0, 0.0, 0.0, 0.0]

        result = await svc.check_embedding(profile)
        assert len(result) == 1
        assert result[0][0].id == "p2"
        assert abs(result[0][1] - 1.0) < 1e-10

    @pytest.mark.asyncio
    async def test_check_embedding_below_threshold(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService, EMBEDDING_SIMILARITY_THRESHOLD

        mock_db = AsyncMock()
        mock_result = MagicMock()
        other_profile = MagicMock(spec=CandidateProfile)
        other_profile.id = "p2"
        other_profile.embedding = [1.0, 1.0, 1.0, 1.0]
        mock_result.scalars.return_value.all.return_value = [other_profile]
        mock_db.execute.return_value = mock_result

        svc = DuplicateDetectionService(mock_db)
        profile = MagicMock(spec=CandidateProfile)
        profile.id = "p1"
        profile.embedding = [1.0, 0.0, 0.0, 0.0]

        result = await svc.check_embedding(profile)
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_create_duplicate_record_with_method(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        svc = DuplicateDetectionService(mock_db)
        c1 = MagicMock(spec=CandidateProfile)
        c1.id = "p1"
        c2 = MagicMock(spec=CandidateProfile)
        c2.id = "p2"

        result = await svc.create_duplicate_record(c1, c2, 0.96, method="embedding")
        assert result.method == "embedding"
        mock_db.add.assert_called_once()


class TestGetAllFlags:
    @pytest.mark.asyncio
    async def test_get_all_flags_combines_methods(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        with patch.object(DuplicateDetectionService, "check", new_callable=AsyncMock) as mock_check:
            with patch.object(DuplicateDetectionService, "check_embedding", new_callable=AsyncMock) as mock_embed:
                with patch.object(DuplicateDetectionService, "compute_text_similarity", return_value=0.5):
                    svc = DuplicateDetectionService(mock_db)

                    exact_match = MagicMock(spec=CandidateProfile)
                    exact_match.id = "p2"
                    exact_match.name = "Alice"
                    exact_match.email = "alice@test.com"

                    embed_match = MagicMock(spec=CandidateProfile)
                    embed_match.id = "p3"
                    embed_match.name = "Bob"

                    mock_check.return_value = [exact_match]
                    mock_embed.return_value = [(embed_match, 0.97)]

                    profile = MagicMock(spec=CandidateProfile)
                    profile.id = "p1"
                    profile.embedding = [1.0, 0.0]

                    flags = await svc.get_all_flags(profile)
                    assert len(flags) == 2
                    methods = {f["method"] for f in flags}
                    assert methods == {"exact", "embedding"}

    @pytest.mark.asyncio
    async def test_get_all_flags_deduplicates(self):
        from app.services.duplicate_detection_service import DuplicateDetectionService

        mock_db = AsyncMock()
        with patch.object(DuplicateDetectionService, "check", new_callable=AsyncMock) as mock_check:
            with patch.object(DuplicateDetectionService, "check_embedding", new_callable=AsyncMock) as mock_embed:
                with patch.object(DuplicateDetectionService, "compute_text_similarity", return_value=0.98):
                    svc = DuplicateDetectionService(mock_db)

                    match = MagicMock(spec=CandidateProfile)
                    match.id = "p2"
                    match.name = "Alice"

                    mock_check.return_value = [match]
                    mock_embed.return_value = [(match, 0.99)]

                    profile = MagicMock(spec=CandidateProfile)
                    profile.id = "p1"
                    profile.embedding = [1.0, 0.0]

                    flags = await svc.get_all_flags(profile)
                    assert len(flags) == 1
                    assert flags[0]["method"] == "exact"


class TestThresholdConstant:
    def test_threshold_is_095(self):
        from app.services.duplicate_detection_service import EMBEDDING_SIMILARITY_THRESHOLD
        assert EMBEDDING_SIMILARITY_THRESHOLD == 0.95
