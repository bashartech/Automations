import logging
import httpx
from typing import List, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 3072


class GeminiEmbeddingService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_embedding_model
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def embed_text(self, text: str) -> List[float]:
        client = await self._get_client()
        model_name = self.model.removeprefix("models/")
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:embedContent",
            params={"key": self.api_key},
            json={"content": {"parts": [{"text": text[:30000]}]}},
        )
        resp.raise_for_status()
        data = resp.json()
        embedding = data["embedding"]["values"]
        if len(embedding) != EMBEDDING_DIM:
            logger.warning(
                "Expected dim %d, got %d. Truncating/padding.",
                EMBEDDING_DIM, len(embedding),
            )
            if len(embedding) > EMBEDDING_DIM:
                embedding = embedding[:EMBEDDING_DIM]
            else:
                embedding = embedding + [0.0] * (EMBEDDING_DIM - len(embedding))
        return embedding

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            emb = await self.embed_text(text)
            embeddings.append(emb)
        return embeddings

    async def embed_and_store(self, text: str) -> List[float]:
        return await self.embed_text(text)

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
