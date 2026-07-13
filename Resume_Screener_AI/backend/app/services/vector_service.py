import httpx
from typing import List, Dict, Any
from app.config import get_settings


class VectorService:
    def __init__(self):
        settings = get_settings()
        self.base_url = settings.qdrant_url.rstrip("/")
        self.api_key = settings.qdrant_api_key
        self.collection_name = "candidates"
        self.vector_size = 768

    @property
    def _headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "api-key": self.api_key,
        }

    async def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient() as client:
            resp = await client.request(method, url, headers=self._headers, **kwargs)
            resp.raise_for_status()
            return resp.json()

    async def ensure_collection(self):
        result = await self._request("GET", f"/collections/{self.collection_name}")
        if "status" in result.get("result", {}):
            return
        await self._request("PUT", f"/collections/{self.collection_name}", json={
            "vectors": {
                "size": self.vector_size,
                "distance": "Cosine",
            },
        })

    async def upsert_vector(self, point_id: str, vector: List[float], payload: Dict[str, Any]):
        await self.ensure_collection()
        await self._request("PUT", f"/collections/{self.collection_name}/points", json={
            "points": [{
                "id": point_id,
                "vector": vector,
                "payload": payload,
            }],
        })

    async def search(self, query_vector: List[float], top_k: int = 20) -> List[Dict[str, Any]]:
        await self.ensure_collection()
        result = await self._request("POST", f"/collections/{self.collection_name}/points/search", json={
            "vector": query_vector,
            "limit": top_k,
            "with_payload": True,
        })
        return result.get("result", [])

    async def delete_point(self, point_id: str):
        await self._request("POST", f"/collections/{self.collection_name}/points/delete", json={
            "points": [point_id],
        })
