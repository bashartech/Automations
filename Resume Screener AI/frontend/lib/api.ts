const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bashartc14-res.hf.space';

export interface SkillExtractResponse {
  skills: string[];
  experience_years: number | null;
  education: string | null;
}

export interface MatchResponse {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
}

export const api = {
  async extractSkills(text: string): Promise<SkillExtractResponse> {
    const response = await fetch(`${API_BASE_URL}/api/extract-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to extract skills');
    }

    return response.json();
  },

  async matchResume(resumeText: string, jobDescription: string): Promise<MatchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to match resume');
    }

    return response.json();
  },
};
