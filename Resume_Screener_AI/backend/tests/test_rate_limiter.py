import pytest
from app.services.rate_limiter import RateLimiter


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_allows_within_limit(self):
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        for _ in range(5):
            allowed, remaining = await limiter.check("test-key")
            assert allowed is True

    @pytest.mark.asyncio
    async def test_blocks_over_limit(self):
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        for _ in range(3):
            await limiter.check("over-key")
        allowed, remaining = await limiter.check("over-key")
        assert allowed is False
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_returns_remaining_count(self):
        limiter = RateLimiter(max_requests=10, window_seconds=60)
        allowed, remaining = await limiter.check("remaining-key")
        assert allowed is True
        assert remaining == 9

    @pytest.mark.asyncio
    async def test_different_keys_independent(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        await limiter.check("key-a")
        await limiter.check("key-a")
        allowed_a, _ = await limiter.check("key-a")
        assert allowed_a is False

        allowed_b, _ = await limiter.check("key-b")
        assert allowed_b is True
