import pytest
from app.services.embedding_service import EMBEDDING_DIM


class TestEmbeddingConstants:
    def test_embedding_dim_is_768(self):
        assert EMBEDDING_DIM == 768

    def test_embedding_dim_is_correct_type(self):
        assert isinstance(EMBEDDING_DIM, int)
        assert EMBEDDING_DIM > 0
