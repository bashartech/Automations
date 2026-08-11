"""
Phase 12 — Step 12.2: Rate limiter load test.
Simulates N concurrent AI API calls to validate rate limiter queuing.

Usage:
    python -m tests.benchmarks.bench_rate_limit [--concurrent 100]
"""

import asyncio
import time
import sys
import os
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))


async def simulate_ai_call(limiter, call_id):
    await limiter.wait_for_capacity()
    # Simulate API call duration
    await asyncio.sleep(0.05)
    return call_id


async def run_benchmark(concurrent=100, rate_limit=30):
    from app.services.rate_limiter import AIApiRateLimiter

    limiter = AIApiRateLimiter(max_requests=rate_limit, window_seconds=60)
    limiter._use_redis = False
    limiter._in_memory_store = {}

    print(f"[Bench] Rate limiter test: {concurrent} concurrent calls, {rate_limit} req/min limit")
    print(f"[Bench] Starting at {time.strftime('%H:%M:%S')}")

    start = time.monotonic()

    tasks = [simulate_ai_call(limiter, i) for i in range(concurrent)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    elapsed = time.monotonic() - start

    success = sum(1 for r in results if isinstance(r, int))
    errors = sum(1 for r in results if isinstance(r, Exception))

    print(f"\n[Bench] === Results ===")
    print(f"  Concurrent:  {concurrent}")
    print(f"  Successful:  {success}")
    print(f"  Errors:      {errors}")
    print(f"  Total time:  {elapsed:.2f}s")
    print(f"  Throughput:  {success/elapsed:.1f} calls/s")
    print(f"  Avg per call: {(elapsed/success)*1000:.1f}ms" if success else "  N/A")

    # Check that the rate limiter actually throttled
    stats = limiter.get_stats() if hasattr(limiter, "get_stats") else {}
    print(f"  Limiter stats: {stats}")


def main():
    parser = argparse.ArgumentParser(description="Rate limiter concurrency test")
    parser.add_argument("--concurrent", type=int, default=100, help="Number of concurrent calls (default: 100)")
    parser.add_argument("--rate-limit", type=int, default=30, help="Rate limit per minute (default: 30)")
    args = parser.parse_args()
    asyncio.run(run_benchmark(concurrent=args.concurrent, rate_limit=args.rate_limit))


if __name__ == "__main__":
    main()
