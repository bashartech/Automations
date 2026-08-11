import time
import logging
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_redis_available: Optional[bool] = None


async def _get_redis():
    global _redis_available
    if _redis_available is False:
        return None
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2)
        await r.ping()
        _redis_available = True
        return r
    except Exception as e:
        _redis_available = False
        logger.warning("Redis unavailable, using in-memory fallback: %s", e)
        return None


class RateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._mem_store: dict[str, list[float]] = {}

    async def check(self, key: str) -> tuple[bool, int]:
        r = await _get_redis()
        if r:
            try:
                return await self._check_redis(r, key)
            except Exception:
                pass
        now = time.time()
        window_start = now - self.window_seconds
        timestamps = [t for t in self._mem_store.get(key, []) if t > window_start]
        allowed = len(timestamps) < self.max_requests
        if allowed:
            timestamps.append(now)
            self._mem_store[key] = timestamps
        remaining = max(0, self.max_requests - len(timestamps))
        return allowed, remaining

    async def _check_redis(self, r, key: str) -> tuple[bool, int]:
        now = int(time.time())
        window_key = f"ratelimit:{key}:{now // self.window_seconds}"
        count = await r.incr(window_key)
        if count == 1:
            await r.expire(window_key, self.window_seconds * 2)
        remaining = max(0, self.max_requests - count)
        return count <= self.max_requests, remaining

    def _check_memory(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        timestamps = self._mem_store.get(key, [])
        timestamps = [t for t in timestamps if t > window_start]
        if len(timestamps) >= self.max_requests:
            return False
        timestamps.append(now)
        self._mem_store[key] = timestamps
        return True


class AIApiRateLimiter:
    def __init__(self):
        self.groq = RateLimiter(max_requests=30, window_seconds=60)
        self.gemini = RateLimiter(max_requests=60, window_seconds=60)

    async def check_groq(self) -> tuple[bool, int]:
        return await self.groq.check("groq")

    async def check_gemini(self) -> tuple[bool, int]:
        return await self.gemini.check("gemini")

    async def wait_for_capacity(self, provider: str, max_wait: int = 30) -> bool:
        rate_limiter = self.groq if provider == "groq" else self.gemini
        waited = 0
        while waited < max_wait:
            allowed, _ = await rate_limiter.check(provider)
            if allowed:
                return True
            await __import__("asyncio").sleep(1)
            waited += 1
        return False
