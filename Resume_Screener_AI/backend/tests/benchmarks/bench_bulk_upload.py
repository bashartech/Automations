"""
Phase 12 — Step 12.1: Bulk upload benchmark.
Uploads N simulated resumes and measures processing throughput.

Usage:
    python -m tests.benchmarks.bench_bulk_upload [--count 200] [--concurrent 10]
"""

import asyncio
import time
import sys
import os
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

SAMPLE_RESUME = """John Benchmark
john.b@test.com

SUMMARY
Experienced engineer with {years} years in Python and backend systems.

SKILLS
Python, {extra_skill}, PostgreSQL, Docker, Linux

EXPERIENCE
Senior Engineer | Company | 2020-2025
- Built scalable microservices
- Worked with Kubernetes and CI/CD

EDUCATION
B.S. Computer Science | University | 2018
"""


def generate_resumes(count):
    skills_pool = ["FastAPI", "Django", "Flask", "AWS", "GCP", "Redis", "GraphQL", "Kafka", "Celery"]
    return [
        SAMPLE_RESUME.format(years=3 + (i % 10), extra_skill=skills_pool[i % len(skills_pool)])
        for i in range(count)
    ]


async def run_benchmark(count=200):
    from app.database import get_db, AsyncSession
    from app.repositories.candidate_repository import CandidateRepository
    from app.services.profile_extraction_service import ProfileExtractionService

    print(f"[Bench] Generating {count} synthetic resumes...")
    resumes = generate_resumes(count)

    db = await anext(get_db())

    print(f"[Bench] Starting extraction benchmark at {datetime.now().isoformat()}")
    start = time.monotonic()
    processed = 0
    errors = 0

    for i, text in enumerate(resumes):
        try:
            service = ProfileExtractionService(db, "bench-user")
            profile = await service.extract(text)
            processed += 1
        except Exception as e:
            errors += 1
            print(f"  Error on resume {i}: {e}")

        if (i + 1) % 50 == 0:
            elapsed = time.monotonic() - start
            rate = (i + 1) / elapsed
            print(f"[Bench] {i+1}/{count} processed ({rate:.1f}/s) | errors: {errors}")

    elapsed = time.monotonic() - start
    rate = processed / elapsed if elapsed > 0 else 0
    print(f"\n[Bench] === Results ===")
    print(f"  Total:       {count}")
    print(f"  Processed:   {processed}")
    print(f"  Errors:      {errors}")
    print(f"  Time:        {elapsed:.2f}s")
    print(f"  Throughput:  {rate:.2f} resumes/s")
    print(f"  Per resume:  {(elapsed/processed)*1000:.1f}ms" if processed else "  N/A")

    db.close()


def main():
    parser = argparse.ArgumentParser(description="Bulk resume upload benchmark")
    parser.add_argument("--count", type=int, default=200, help="Number of resumes (default: 200)")
    parser.add_argument("--concurrent", type=int, default=10, help="Concurrency (unused, placeholder for Phase 12.2)")
    args = parser.parse_args()
    asyncio.run(run_benchmark(count=args.count))


if __name__ == "__main__":
    main()
