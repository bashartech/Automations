import os
import uuid
import logging
from typing import List, Dict, Any

from qdrant_client import QdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

COLLECTION_NAME = "company_knowledge"

class RAGRetriever:
    def __init__(self):
        # Load embedding model once per instance
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Initialize Qdrant Client
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            self.client.get_collection(collection_name=COLLECTION_NAME)
        except UnexpectedResponse as e:
            if "Not found" in str(e):
                logger.info(f"Creating collection '{COLLECTION_NAME}'...")
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=384,  # Default size for sentence-transformers all-MiniLM-L6-v2
                        distance=models.Distance.COSINE
                    ),
                )
            else:
                logger.error(f"Unexpected response from Qdrant: {e}")
        except Exception as e:
            logger.error(f"Error checking/creating collection: {e}")

    def _get_embedding(self, text: str) -> List[float]:
        return self.embedding_model.encode([text])[0].tolist()

    def upsert_chunks(self, filename: str, chunks: List[str]):
        """
        Convert chunks to embeddings and upsert to Qdrant.
        """
        if not chunks:
            return

        points = []
        for i, chunk in enumerate(chunks):
            embedding = self._get_embedding(chunk)
            point = models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "filename": filename,
                    "chunk_index": i,
                    "text": chunk
                }
            )
            points.append(point)

        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        logger.info(f"Upserted {len(chunks)} chunks for {filename}")

    def retrieve_context(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves contextually relevant textbook content based on the user's query.
        """
        try:
            embedding = self._get_embedding(query)
            result = self.client.query_points(
                collection_name=COLLECTION_NAME,
                query=embedding,
                limit=limit
            )

            results = []
            for point in result.points:
                if "text" in point.payload:
                    results.append({
                        "text": point.payload["text"],
                        "filename": point.payload.get("filename", "Unknown"),
                        "chunk_index": point.payload.get("chunk_index", -1)
                    })
            return results
        except Exception as e:
            logger.error(f"Failed to retrieve from Qdrant: {e}")
            return []

# Singleton instance
rag_retriever = RAGRetriever()
