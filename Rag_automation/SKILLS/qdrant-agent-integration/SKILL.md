---
name: qdrant-agent-integration
description: Use this skill whenever the user asks to integrate the Qdrant Vector Database, add semantic search capabilities to an agent, or refactor vector DB operations using the OpenAI Agent SDK. It provides the standard pattern for exposing Qdrant queries as `@function_tool` tools.
---

# Qdrant Agent Integration Skill

This skill explains how to correctly integrate the Qdrant Vector Database with the OpenAI Agent SDK. Instead of defining database connections and retrieval tools globally, the standard pattern in this codebase is to encapsulate them in a "Skill" class.

## Core Architectural Pattern

When instructed to add Qdrant search capabilities to an agent, always use the following object-oriented pattern to prevent redundant model loading and keep the global namespace clean.

### 1. Skill Class Implementation

Always create a dedicated class (e.g., `QdrantSkill`) that handles the `SentenceTransformer` and `QdrantClient`.

```python
import os
import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from agents import function_tool

logger = logging.getLogger(__name__)

class QdrantSkill:
    def __init__(self, collection_name: str = "RoboBook", embedding_model_name: str = "all-MiniLM-L6-v2"):
        # Load embedding model once per instance
        self.embedding_model = SentenceTransformer(embedding_model_name)
        
        # Initialize Qdrant Client
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = collection_name

    def _get_embedding(self, text: str) -> List[float]:
        return self.embedding_model.encode([text])[0].tolist()

    def get_tools(self) -> List[callable]:
        """Returns tools configured for the Agent."""
        
        @function_tool
        def retrieve_knowledge(query: str, limit: int = 5) -> Dict[str, Any]:
            """
            Retrieves contextually relevant textbook content based on the user's query.
            """
            try:
                embedding = self._get_embedding(query)
                result = self.client.query_points(
                    collection_name=self.collection_name,
                    query=embedding,
                    limit=limit
                )

                texts = []
                sources = []
                
                for point in result.points:
                    if "text" in point.payload:
                        texts.append(point.payload["text"])
                        sources.append({
                            "source_file": point.payload.get("source", "Unknown"),
                            "chunk_index": point.payload.get("chunk_index", "Unknown")
                        })

                return {"retrieved_content": texts, "metadata": sources}
            except Exception as e:
                logger.error(f"Failed to retrieve from Qdrant: {e}")
                return {"error": str(e), "retrieved_content": []}

        return [retrieve_knowledge]
```

### 2. Agent Injection

When wiring this up in an application (like FastAPI's `main.py`), instantiate the class *once* globally and pass its tools to the agent:

```python
from skills.qdrant_skill import QdrantSkill
from agents import Agent

# 1. Global instantiation (prevents reloading the model)
qdrant_knowledge_skill = QdrantSkill(collection_name="RoboBook")

def create_agent():
    # 2. Extract tools
    tools = qdrant_knowledge_skill.get_tools()
    
    # 3. Inject into agent
    return Agent(
        name="KnowledgeAssistant",
        instructions="Answer questions using the retrieve_knowledge tool.",
        model=chat_model,
        tools=tools
    )
```

## Best Practices

1. **Avoid Global Instantiation of Models**: Do not instantiate `SentenceTransformer` directly in the global scope of `main.py`. Wrap it in the class.
2. **Handle Payload Safely**: Always check if `"text"` exists in `point.payload` before accessing it to prevent `KeyError`s during retrieval.
3. **Source Tracking**: Ensure that `retrieve_knowledge` returns metadata (like `source_file` and `chunk_index`) alongside the text so the LLM can cite its sources.
