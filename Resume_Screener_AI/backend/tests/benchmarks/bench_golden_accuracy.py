"""
Phase 12 — Step 12.4: Golden resume accuracy check.
Runs the full analysis pipeline against the golden test set and reports accuracy.

Usage:
    python -m tests.benchmarks.bench_golden_accuracy
"""

import json
import os
import sys
import time
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

GOLDEN_SET_PATH = os.path.join(os.path.dirname(__file__), "../golden_test_set.json")


def load_golden_set():
    with open(GOLDEN_SET_PATH) as f:
        return json.load(f)["resumes"]


def score_in_range(value, expected):
    if value is None:
        return False, f"None not in [{expected['min']}, {expected['max']}]"
    in_range = expected["min"] <= value <= expected["max"]
    msg = f"{value:.1f} in [{expected['min']}, {expected['max']}]" if in_range else \
          f"{value:.1f} NOT in [{expected['min']}, {expected['max']}]"
    return in_range, msg


async def check_golden_entry(agent, entry):
    result = await agent.analyze("cand_id", "", entry["job_description"])
    exp = entry["expected"]
    checks = {}
    all_pass = True

    for key in ("overall_score", "technical_score", "skill_match_score", "experience_score"):
        actual = getattr(result, key, None)
        passed, msg = score_in_range(actual, exp[key])
        checks[key] = {"passed": passed, "message": msg, "actual": actual, "expected": exp[key]}
        if not passed:
            all_pass = False

    if "recommendation" in exp:
        rec_match = (result.ai_recommendation == exp["recommendation"])
        checks["recommendation"] = {
            "passed": rec_match,
            "message": f"'{result.ai_recommendation}' == '{exp['recommendation']}'" if rec_match else
                       f"'{result.ai_recommendation}' != '{exp['recommendation']}'",
            "actual": result.ai_recommendation,
            "expected": exp["recommendation"],
        }
        if not rec_match:
            all_pass = False

    return entry["id"], all_pass, checks


async def run_accuracy_check():
    from app.services.combined_analysis_agent import CombinedAnalysisAgent
    from unittest.mock import AsyncMock
    from app.database import AsyncSession

    entries = load_golden_set()
    print(f"[Golden] Loaded {len(entries)} golden entries from {GOLDEN_SET_PATH}")
    print(f"[Golden] Starting accuracy check at {datetime.now().isoformat()}\n")

    agent = CombinedAnalysisAgent(AsyncMock(spec=AsyncSession))
    passes = 0
    total_checks = 0
    results = []

    for entry in entries:
        eid, all_pass, checks = await check_golden_entry(agent, entry)
        results.append({"id": eid, "pass": all_pass, "checks": checks})
        n_passed = sum(1 for c in checks.values() if c["passed"])
        n_total = len(checks)
        total_checks += n_total
        if all_pass:
            passes += 1
            print(f"  PASS {eid}: {n_passed}/{n_total}")
        else:
            print(f"  FAIL {eid}: {n_passed}/{n_total}")
            for k, v in checks.items():
                if not v["passed"]:
                    print(f"    {k}: {v['message']}")

    accuracy = (passes / len(entries)) * 100 if entries else 0
    print(f"\n[Golden] === Results ===")
    print(f"  Entries:     {len(entries)}")
    print(f"  Passed:      {passes}")
    print(f"  Accuracy:    {accuracy:.1f}%")
    print(f"  Total checks: {total_checks}")
    print(f"\n  Threshold:   80% (Phase 12 requirement)")
    if accuracy >= 80:
        print(f"  Status: ✅ PASS (meets 80% threshold)")
    else:
        print(f"  Status: ❌ FAIL (below 80% threshold)")

    return accuracy >= 80


def main():
    import asyncio
    success = asyncio.run(run_accuracy_check())
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
