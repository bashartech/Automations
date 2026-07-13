const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// ---- Auth helpers ----
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token) return { 'Authorization': `Bearer ${token}` };
  return {};
}

function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.headers) {
    const h = options.headers as Record<string, string>;
    Object.keys(h).forEach(k => { headers[k] = h[k]; });
  }
  Object.assign(headers, authHeaders());
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

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

export interface CandidateProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  location: string | null;
  summary: string | null;
  skills: string[] | null;
  experience: Record<string, any>[] | null;
  education: Record<string, any>[] | null;
  certifications: string[] | null;
  projects: Record<string, any>[] | null;
  category: string | null;
  overall_score: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  skills_score: number;
  experience_score: number;
  education_score: number;
  certification_score: number;
  project_score: number;
  overall_score: number;
}

export interface AnalyzeResponse {
  candidate_name: string | null;
  overall_score: number;
  scores: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  missing_requirements: string[];
  recommendation: string;
  summary: string;
  category: string;
}

export interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  skills: string[] | null;
  summary: string | null;
  category: string | null;
  overall_score: number | null;
  relevance_score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface DashboardMetrics {
  total_resumes: number;
  processed_resumes: number;
  strong_matches: number;
  duplicate_candidates: number;
  average_match_score: number;
  category_distribution: Record<string, number>;
}

export interface WeightsResponse {
  skill_weight: number;
  experience_weight: number;
  education_weight: number;
  certification_weight: number;
  project_weight: number;
}

export interface CreditPack {
  id: string;
  name: string;
  price_cents: number;
  credits: number;
  active: boolean;
}

export interface CreditBalance {
  credits_remaining: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface CreateCheckoutResponse {
  url: string;
  credits_added: number;
  success: boolean;
  mock: boolean;
}

export interface ProcessingJobResponse {
  id: string;
  status: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  job_description: string | null;
  file_paths: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ContentItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

function handleError(res: Response): Promise<never> {
  return res.json().then((err) => { throw new Error(err.detail || 'API Error'); });
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async me(): Promise<UserResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/me`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
};

export const api = {
  async extractSkills(text: string): Promise<SkillExtractResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/extract-skills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async matchResume(resumeText: string, jobDescription: string): Promise<MatchResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/match`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async uploadFile(file: File): Promise<{ filename: string; extracted_text: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async extractProfile(text: string): Promise<{ profile: CandidateProfile; message: string }> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/extract`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getCandidates(category?: string, resumeId?: string, batchId?: string, minScore?: number, status?: string): Promise<CandidateProfile[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (resumeId) params.set('resume_id', resumeId);
    if (batchId) params.set('batch_id', batchId);
    if (minScore !== undefined) params.set('min_score', String(minScore));
    if (status) params.set('status', status);
    const qs = params.toString();
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/${qs ? '?' + qs : ''}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getCandidate(id: string): Promise<CandidateProfile> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/${id}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async updateCandidate(id: string, data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async deleteCandidate(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/${id}`, { method: 'DELETE' });
    if (!res.ok) return handleError(res);
  },

  async analyzeCandidate(resumeId: string, jobDescription: string): Promise<AnalyzeResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async searchCandidates(query: string): Promise<SearchResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/search/candidates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await apiFetch(`${API_BASE_URL}/api/dashboard/metrics`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getWeights(): Promise<WeightsResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/weights`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async updateWeights(data: Partial<WeightsResponse>): Promise<WeightsResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/weights`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async bulkUpload(file: File, jobDescription?: string): Promise<{ job_id: string; total_files: number; message: string; skipped_files?: string[]; skipped_count?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/bulk-upload`, { method: 'POST', body: formData });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async bulkUploadFiles(files: File[], jobDescription?: string): Promise<{ job_id: string; total_files: number; message: string; skipped_files?: string[]; skipped_count?: number }> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/bulk-upload-files`, { method: 'POST', body: formData });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getBulkStatus(jobId: string): Promise<ProcessingJobResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/bulk-upload/${jobId}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getBatches(): Promise<ProcessingJobResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/batches/`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getBatch(jobId: string): Promise<ProcessingJobResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/batches/${jobId}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async deleteBatch(jobId: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/batches/${jobId}`, { method: 'DELETE' });
    if (!res.ok) return handleError(res);
  },

  async reanalyzeBatch(jobId: string, jobDescription: string): Promise<{ message: string; candidate_count: number }> {
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/batches/${jobId}/reanalyze`, { method: 'POST', body: formData });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async retryBatch(jobId: string): Promise<{ message: string; retried_count: number }> {
    const res = await apiFetch(`${API_BASE_URL}/api/resumes/batches/${jobId}/retry`, { method: 'POST' });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async bulkDeleteCandidates(ids: string[]): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/bulk/delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return handleError(res);
  },

  async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/bulk/status?status=${encodeURIComponent(status)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return handleError(res);
  },

  async compareCandidates(ids: string[]): Promise<CandidateProfile[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/compare`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getCreditPacks(): Promise<CreditPack[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/credits/packs`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getCreditBalance(): Promise<CreditBalance> {
    const res = await apiFetch(`${API_BASE_URL}/api/credits/balance`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async getCreditHistory(): Promise<CreditTransaction[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/credits/history`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async createCheckout(packId: string): Promise<CreateCheckoutResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/credits/create-checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: packId }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  getExportCsvUrl(params?: { category?: string; batchId?: string; minScore?: number; status?: string }): string {
    const p = new URLSearchParams();
    if (params?.category) p.set('category', params.category);
    if (params?.batchId) p.set('batch_id', params.batchId);
    if (params?.minScore !== undefined) p.set('min_score', String(params.minScore));
    if (params?.status) p.set('status', params.status);
    const qs = p.toString();
    return `${API_BASE_URL}/api/candidates/export/csv${qs ? '?' + qs : ''}`;
  },
};
