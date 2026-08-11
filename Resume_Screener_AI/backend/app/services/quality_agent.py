import re
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

QUALITY_RULES = [
    "file_readable",
    "min_text_length",
    "contact_info",
    "skills_section",
    "experience_section",
    "education_section",
    "no_placeholder_text",
    "single_column_structure",
]


class QualityCheckResult:
    def __init__(self, passed: bool, flag: str, detail: str = ""):
        self.passed = passed
        self.flag = flag
        self.detail = detail

    def to_dict(self) -> Dict:
        return {"flag": self.flag, "passed": self.passed, "detail": self.detail}


class QualityAgent:
    MIN_TEXT_LENGTH = 100

    PLACEHOLDER_PATTERNS = [
        re.compile(r"lorem ipsum", re.IGNORECASE),
        re.compile(r"insert text here", re.IGNORECASE),
        re.compile(r"sample text", re.IGNORECASE),
        re.compile(r"your name", re.IGNORECASE),
        re.compile(r"your address", re.IGNORECASE),
        re.compile(r"\[.*?\]", re.IGNORECASE),
    ]

    @classmethod
    def check_all(cls, text: str) -> List[QualityCheckResult]:
        results = []
        results.append(cls._check_file_readable(text))
        results.append(cls._check_min_text_length(text))
        results.append(cls._check_contact_info(text))
        results.append(cls._check_skills_section(text))
        results.append(cls._check_experience_section(text))
        results.append(cls._check_education_section(text))
        results.append(cls._check_placeholder_text(text))
        results.append(cls._check_single_column_structure(text))
        return results

    @classmethod
    def failed_flags(cls, results: List[QualityCheckResult]) -> List[str]:
        return [r.flag for r in results if not r.passed]

    @classmethod
    def score(cls, results: List[QualityCheckResult]) -> float:
        if not results:
            return 100.0
        passed = sum(1 for r in results if r.passed)
        return round((passed / len(results)) * 100, 1)

    @classmethod
    def _check_file_readable(cls, text: str) -> QualityCheckResult:
        passed = bool(text and text.strip())
        return QualityCheckResult(
            passed=passed,
            flag="file_readable",
            detail="" if passed else "File could not be read or contains no text",
        )

    @classmethod
    def _check_min_text_length(cls, text: str) -> QualityCheckResult:
        passed = len(text.strip()) >= cls.MIN_TEXT_LENGTH
        return QualityCheckResult(
            passed=passed,
            flag="min_text_length",
            detail=f"Text length {len(text.strip())} chars (min {cls.MIN_TEXT_LENGTH})" if not passed else "",
        )

    @classmethod
    def _check_contact_info(cls, text: str) -> QualityCheckResult:
        has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text))
        has_phone = bool(re.search(r"[\+\d][\d\s\-\.\(\)]{7,}", text))
        passed = has_email or has_phone
        return QualityCheckResult(
            passed=passed,
            flag="contact_info",
            detail="No email or phone found" if not passed else "",
        )

    @classmethod
    def _check_skills_section(cls, text: str) -> QualityCheckResult:
        patterns = [
            r"(?i)(?:technical|professional|core)?\s*skills?",
            r"(?i)competencies?",
            r"(?i)technologies?",
            r"(?i)expertise",
            r"(?i)proficien",
        ]
        passed = any(re.search(p, text) for p in patterns)
        return QualityCheckResult(
            passed=passed,
            flag="skills_section",
            detail="No skills section detected" if not passed else "",
        )

    @classmethod
    def _check_experience_section(cls, text: str) -> QualityCheckResult:
        patterns = [
            r"(?i)(?:work|professional|relevant)?\s*experience",
            r"(?i)employment",
            r"(?i)work history",
            r"(?i)career",
        ]
        passed = any(re.search(p, text) for p in patterns)
        return QualityCheckResult(
            passed=passed,
            flag="experience_section",
            detail="No experience section detected" if not passed else "",
        )

    @classmethod
    def _check_education_section(cls, text: str) -> QualityCheckResult:
        patterns = [
            r"(?i)education",
            r"(?i)academic",
            r"(?i)qualifications?",
        ]
        passed = any(re.search(p, text) for p in patterns)
        return QualityCheckResult(
            passed=passed,
            flag="education_section",
            detail="No education section detected" if not passed else "",
        )

    @classmethod
    def _check_placeholder_text(cls, text: str) -> QualityCheckResult:
        matches = [p.search(text) for p in cls.PLACEHOLDER_PATTERNS]
        passed = not any(matches)
        if not passed:
            found = [m.group() for m in matches if m]
            detail = f"Placeholder text detected: {', '.join(found[:3])}"
        else:
            detail = ""
        return QualityCheckResult(
            passed=passed,
            flag="no_placeholder_text",
            detail=detail,
        )

    @classmethod
    def _check_single_column_structure(cls, text: str) -> QualityCheckResult:
        lines = [l for l in text.split("\n") if l.strip()]
        if len(lines) < 3:
            return QualityCheckResult(passed=True, flag="single_column_structure", detail="Too few lines to evaluate")

        short_lines = sum(1 for l in lines if len(l.strip()) < 20)
        ratio = short_lines / len(lines)

        passed = ratio < 0.5
        return QualityCheckResult(
            passed=passed,
            flag="single_column_structure",
            detail=f"Possible multi-column layout ({ratio:.0%} short lines)" if not passed else "",
        )
