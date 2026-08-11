import json
import logging
import httpx
from typing import Any
from app.config import get_settings
from app.services.rate_limiter import AIApiRateLimiter

logger = logging.getLogger(__name__)


class AsyncAIClient:
    def __init__(self):
        settings = get_settings()
        self.groq_api_key = settings.groq_api_key
        self.gemini_api_key = settings.gemini_api_key
        self.groq_model = settings.groq_model
        self.gemini_model = settings.gemini_model
        self.temperature = settings.groq_temperature
        self.max_tokens = settings.groq_max_tokens
        self.provider = settings.ai_provider.lower()
        self.rate_limiter = AIApiRateLimiter()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def chat_completion(self, messages: list[dict], response_format: str = "json") -> str:
        client = await self._get_client()

        # Try primary provider
        content = await self._try_provider(client, self.provider, messages)
        if content:
            return content

        # Fallback to other provider
        fallback = "gemini" if self.provider == "groq" else "groq"
        logger.warning("Primary provider %s failed, falling back to %s", self.provider, fallback)
        content = await self._try_provider(client, fallback, messages)
        if content:
            return content

        raise RuntimeError(f"Both providers failed for chat completion")

    async def _try_provider(self, client: httpx.AsyncClient, provider: str, messages: list[dict]) -> str | None:
        allowed = await self.rate_limiter.wait_for_capacity(provider)
        if not allowed:
            logger.warning("Rate limit exceeded for %s, skipping", provider)
            return None

        try:
            if provider == "groq":
                return await self._call_groq(client, messages)
            return await self._call_gemini(client, messages)
        except Exception as e:
            logger.error("%s API call failed: %s", provider, e)
            return None

    async def _call_groq(self, client: httpx.AsyncClient, messages: list[dict]) -> str:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.groq_model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "response_format": {"type": "json_object"},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        finish = data["choices"][0].get("finish_reason", "")
        if finish == "length":
            logger.warning("Groq response was truncated (finish_reason=length)")
        return content

    async def _call_gemini(self, client: httpx.AsyncClient, messages: list[dict]) -> str:
        system_msg = ""
        user_msg = ""
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            elif m["role"] == "user":
                user_msg = m["content"]

        contents = []
        if system_msg:
            contents.append({"role": "user", "parts": [{"text": f"System: {system_msg}\n\n{user_msg}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": user_msg}]})

        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent",
            params={"key": self.gemini_api_key},
            json={
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": self.max_tokens,
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("Empty Gemini response")
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return text

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
