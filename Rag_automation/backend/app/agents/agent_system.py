import os
import logging
from typing import Dict, Any
from openai import AsyncOpenAI
from agents import Agent, function_tool, Runner, SQLiteSession, set_default_openai_client, set_default_openai_api, set_tracing_disabled


from app.rag.retriever import rag_retriever

logger = logging.getLogger(__name__)

# Configure the Groq client to be used with OpenAI Agents SDK
groq_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


# Set Groq client as default for Agents SDK
set_default_openai_client(groq_client)
set_default_openai_api("chat_completions")
set_tracing_disabled(True)


# Define the retrieval tool for the agent
@function_tool
def retrieve_knowledge(query: str, limit: int = 5) -> Dict[str, Any]:
    """
    Retrieves contextually relevant company knowledge based on the user's query.
    
    Args:
        query: The search query to find relevant information.
        limit: The maximum number of results to return.
    """
    try:
        results = rag_retriever.retrieve_context(query, limit)
        texts = [r["text"] for r in results]
        sources = [{"filename": r["filename"], "chunk_index": r["chunk_index"]} for r in results]
        return {"retrieved_content": texts, "metadata": sources}
    except Exception as e:
        logger.error(f"Error in retrieve_knowledge tool: {e}")
        return {"error": str(e), "retrieved_content": []}

# Define the main RAG agent
rag_agent = Agent(
    name="CompanyKnowledgeAssistant",
    instructions="""You are a helpful and intelligent company knowledge assistant.
Your goal is to answer user questions accurately based ONLY on the provided context retrieved from company documents.

Rules:
1. Use the `retrieve_knowledge` tool to search for relevant context based on the user's question.
2. Formulate your answer based solely on the retrieved context.
3. If the answer cannot be found in the retrieved context, clearly state: "I don't have enough information from the documents to answer this question."
4. Always cite your sources by mentioning the filename if it is available in the retrieved metadata.
5. Format your answers clearly using Markdown (e.g., bullet points, bold text).
""",
    tools=[retrieve_knowledge],
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
)
