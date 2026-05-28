import os
import shutil
import tempfile
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables before importing modules that depend on them
load_dotenv()

from agents import Runner

from app.services.document_service import extract_text, chunk_text
from app.rag.retriever import rag_retriever
from app.agents.agent_system import rag_agent

app = FastAPI(
    title="RAG Knowledge Assistant API",
    description="Backend for the RAG chatbot",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document, extract text, chunk it, and index it in Qdrant.
    """
    # Save the file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    try:
        # Extract text
        text = extract_text(temp_file_path, file.filename)
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from document.")
            
        # Chunk text
        chunks = chunk_text(text, chunk_size=500, overlap=100)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Document text was too short or empty.")
            
        # Embed and upsert chunks to Qdrant
        rag_retriever.upsert_chunks(filename=file.filename, chunks=chunks)
        
        return {"status": "success", "filename": file.filename, "chunks_indexed": len(chunks)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/chat/query", response_model=QueryResponse)
async def chat_query(request: QueryRequest):
    """
    Ask a question to the RAG agent.
    """
    try:
        # We run the agent using the runner. The agent will use the retrieve_knowledge tool.
        result = await Runner.run(rag_agent, request.query)
        return QueryResponse(answer=result.final_output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
