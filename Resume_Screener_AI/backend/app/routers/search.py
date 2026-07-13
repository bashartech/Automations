from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.candidate_repository import CandidateRepository
from app.services.vector_service import VectorService
from app.services.ai_service import AIService
from app.models.candidate_schemas import SearchRequest, SearchResponse, SearchResult

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("/candidates", response_model=SearchResponse)
async def search_candidates(request: SearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        vector_service = VectorService()
        ai_service = AIService()
        repo = CandidateRepository(db)

        query_embedding = await _generate_embedding(ai_service, request.query)
        results = await vector_service.search(query_embedding, top_k=20)

        candidate_ids = [r["id"] for r in results]
        scores = {r["id"]: r.get("score", 0) for r in results}

        search_results = []
        for cid in candidate_ids:
            profile = await repo.get_profile(cid)
            if profile:
                search_results.append(SearchResult(
                    id=profile.id,
                    name=profile.name,
                    email=profile.email,
                    skills=profile.skills,
                    summary=profile.summary,
                    category=profile.category,
                    overall_score=profile.overall_score,
                    relevance_score=scores.get(cid, 0),
                ))

        return SearchResponse(results=search_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_embedding(ai_service: AIService, text: str) -> list:
    response = ai_service.client.embeddings.create(
        model="text-embedding-ada-002",
        input=text,
    )
    return response.data[0].embedding
