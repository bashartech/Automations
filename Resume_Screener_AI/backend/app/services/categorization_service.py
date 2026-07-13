from app.models.orm import CandidateCategory


class CategorizationService:
    def categorize(self, overall_score: float) -> CandidateCategory:
        if overall_score >= 80:
            return CandidateCategory.STRONG_MATCH
        elif overall_score >= 65:
            return CandidateCategory.GOOD_MATCH
        elif overall_score >= 50:
            return CandidateCategory.AVERAGE_MATCH
        elif overall_score >= 35:
            return CandidateCategory.WEAK_MATCH
        else:
            return CandidateCategory.REJECT
