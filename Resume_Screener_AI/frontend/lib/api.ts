const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// ---- Auth helpers ----
const TOKEN_KEY = 'auth_token';
const COMPANY_ID_KEY = 'company_id';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(COMPANY_ID_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function setCompanyId(id: string | null): void {
  if (id) localStorage.setItem(COMPANY_ID_KEY, id);
  else localStorage.removeItem(COMPANY_ID_KEY);
}

export function getCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COMPANY_ID_KEY);
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
  const hasBody = options.body && !(options.body instanceof FormData);
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; role?: string; company_id?: string | null };
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  company_id?: string | null;
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
  total_jobs: number;
  total_candidates: number;
  total_interviews: number;
  total_rejected: number;
  total_selected: number;
  avg_processing_time_seconds: number;
  top_skills: string[];
  funnel: Record<string, number>;
}

// ── Company ──
export interface CompanyResponse {
  id: string; name: string; logo_url: string | null;
  industry: string | null; company_size: string | null;
  website: string | null; country: string | null; city: string | null;
  timezone: string | null; hr_email: string | null; contact_number: string | null;
  created_at: string; updated_at: string;
}

export interface CompanyCreate {
  name: string; industry?: string; company_size?: string;
  website?: string; country?: string; city?: string;
  timezone?: string; hr_email?: string; contact_number?: string;
}

export interface CompanyUpdate {
  name?: string; logo_url?: string; industry?: string;
  company_size?: string; website?: string; country?: string;
  city?: string; timezone?: string; hr_email?: string; contact_number?: string;
}

// ── Company Knowledge ──
export interface CompanyKnowledge {
  id: string; company_id: string;
  mission: string | null; vision: string | null; culture: string | null;
  core_values: string[] | null; work_environment: string | null;
  remote_policy: string | null; working_hours: string | null;
  interview_process: string | null; interview_stages: string[] | null;
  hiring_policy: string | null; required_documents: string[] | null;
  preferred_skills: string[] | null; communication_style: string | null;
  interview_days: number[] | null; interview_time_slots: string[] | null;
  meeting_duration: number; timezone: string | null;
  created_at: string; updated_at: string;
}

export interface CompanyKnowledgeUpdate {
  mission?: string; vision?: string; culture?: string;
  core_values?: string[]; work_environment?: string;
  remote_policy?: string; working_hours?: string;
  interview_process?: string; interview_stages?: string[];
  hiring_policy?: string; required_documents?: string[];
  preferred_skills?: string[]; communication_style?: string;
  interview_days?: number[]; interview_time_slots?: string[];
  meeting_duration?: number; timezone?: string;
}

// ── Email Templates ──
export interface EmailTemplate {
  id: string; company_id: string; type: string;
  subject: string; body: string;
  created_at: string; updated_at: string;
}

export interface EmailTemplateCreate { type: string; subject: string; body: string; }

// ── Jobs ──
export interface JobResponse {
  id: string; company_id: string; department_id: string | null;
  title: string; employment_type: string | null; location: string | null;
  remote_type: string | null; experience_required: string | null;
  salary_min: number | null; salary_max: number | null; currency: string | null;
  num_openings: number; application_deadline: string | null;
  required_skills: string[] | null; preferred_skills: string[] | null;
  responsibilities: string[] | null; qualifications: string[] | null;
  benefits: string[] | null; description: string | null;
  status: string; created_by: string | null;
  created_at: string; updated_at: string;
}

export interface JobCreate {
  title: string; department_id?: string; employment_type?: string;
  location?: string; remote_type?: string; experience_required?: string;
  salary_min?: number; salary_max?: number; currency?: string;
  num_openings?: number; application_deadline?: string;
  required_skills?: string[]; preferred_skills?: string[];
  responsibilities?: string[]; qualifications?: string[]; benefits?: string[];
  description?: string;
}

export interface JDReviewResponse {
  suggestions: string[]; missing_skills: string[];
  grammar_issues: string[]; inclusive_language_suggestions: string[];
  recommendation: string; overall_quality_score: number;
  improved_description: string;
}

export interface JDReviewRequest {
  title: string; description: string; required_skills?: string[];
}

// ── Interviews ──
export interface InterviewResponse {
  id: string; company_id: string; job_id: string | null;
  candidate_id: string; candidate_name: string | null;
  date: string; time: string; timezone: string;
  meeting_link: string | null; interviewer: string | null;
  interview_round: number; status: string; notes: string | null;
  created_at: string; updated_at: string;
}

export interface InterviewCreate {
  job_id?: string; candidate_id: string;
  date: string; time: string; timezone?: string;
  interviewer?: string; interview_round?: number; notes?: string;
}

export interface InterviewSlot {
  id: string; company_id: string; day_of_week: number;
  start_time: string; end_time: string; is_available: boolean;
  created_at: string;
}

export interface InterviewSlotCreate {
  day_of_week: number; start_time: string; end_time: string; is_available?: boolean;
}

// ── Notifications ──
export interface NotificationResponse {
  id: string; company_id: string; user_id: string | null;
  type: string; title: string; message: string;
  link: string | null; read: boolean; created_at: string;
}

// ── Activity Logs ──
export interface ActivityLogResponse {
  id: string; company_id: string | null; user_id: string | null;
  action: string; entity_type: string; entity_id: string | null;
  details: Record<string, any> | null; created_at: string;
}

// ── Admin ──
export interface FailedTask {
  id: string; task_name: string; task_id: string | null;
  correlation_id: string | null; entity_id: string | null;
  error_message: string; traceback: string | null;
  retry_count: number; resolved: boolean; created_at: string;
}

export interface TaskLog {
  id: string; task_name: string; correlation_id: string | null;
  entity_id: string | null; status: string; message: string | null;
  duration_ms: number | null; created_at: string;
}

// ── Department ──
export interface DepartmentResponse {
  id: string; company_id: string; name: string; created_at: string;
}

// ── Analyze V2 ──
export interface AnalyzeResponseV2 {
  candidate_id: string; job_id: string; candidate_name: string | null;
  scores: {
    overall_score: number; technical_score: number;
    experience_score: number; skill_match_score: number;
    education_score: number; project_score: number;
    culture_fit_score: number; confidence_score: number;
  };
  missing_skills: string[]; strengths: string[]; weaknesses: string[];
  risks: string[]; recommendation: string; explanation: string;
  category: string;
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
    const data: AuthResponse = await res.json();
    if (data.user?.company_id) setCompanyId(data.user.company_id);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return handleError(res);
    const data: AuthResponse = await res.json();
    if (data.user?.company_id) setCompanyId(data.user.company_id);
    return data;
  },

  async me(): Promise<UserResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/me`);
    if (!res.ok) return handleError(res);
    const data: UserResponse = await res.json();
    if (data.company_id) setCompanyId(data.company_id);
    return data;
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

  async getCandidates(category?: string, resumeId?: string, batchId?: string, minScore?: number, status?: string, search?: string): Promise<CandidateProfile[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (resumeId) params.set('resume_id', resumeId);
    if (batchId) params.set('batch_id', batchId);
    if (minScore !== undefined) params.set('min_score', String(minScore));
    if (status) params.set('status', status);
    if (search) params.set('search', search);
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

  async exportCsv(params?: { category?: string; batchId?: string; minScore?: number; status?: string }): Promise<void> {
    const p = new URLSearchParams();
    if (params?.category) p.set('category', params.category);
    if (params?.batchId) p.set('batch_id', params.batchId);
    if (params?.minScore !== undefined) p.set('min_score', String(params.minScore));
    if (params?.status) p.set('status', params.status);
    const token = getToken();
    if (token) p.set('token', token);
    const qs = p.toString();
    const res = await apiFetch(`${API_BASE_URL}/api/candidates/export/csv${qs ? '?' + qs : ''}`);
    if (!res.ok) return handleError(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ── Company ──
  async registerCompany(data: CompanyCreate): Promise<CompanyResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/auth/register-company`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    const company: CompanyResponse = await res.json();
    setCompanyId(company.id);
    return company;
  },
  async getCompany(id: string): Promise<CompanyResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${id}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async updateCompany(id: string, data: CompanyUpdate): Promise<CompanyResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async createDepartment(companyId: string, name: string): Promise<DepartmentResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/departments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getDepartments(companyId: string): Promise<DepartmentResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/departments`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getKnowledge(companyId: string): Promise<CompanyKnowledge> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/knowledge`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async updateKnowledge(companyId: string, data: CompanyKnowledgeUpdate): Promise<CompanyKnowledge> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/knowledge`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async uploadKnowledgeDoc(companyId: string, file: File): Promise<{ knowledge: CompanyKnowledge; document_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/knowledge/extract`, { method: 'POST', body: formData });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getEmailTemplates(companyId: string): Promise<EmailTemplate[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/email-templates`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async createEmailTemplate(companyId: string, data: EmailTemplateCreate): Promise<EmailTemplate> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/email-templates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async updateEmailTemplate(companyId: string, id: string, data: Partial<EmailTemplateCreate>): Promise<EmailTemplate> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/email-templates/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  // ── Jobs ──
  async createJob(companyId: string, data: JobCreate): Promise<JobResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getJobs(companyId: string): Promise<JobResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getJob(companyId: string, id: string): Promise<JobResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs/${id}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async updateJob(companyId: string, id: string, data: Partial<JobCreate>): Promise<JobResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async deleteJob(companyId: string, id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) return handleError(res);
  },
  async reviewJobDescription(companyId: string, jobId: string): Promise<JDReviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs/${jobId}/review`, {
      method: 'POST',
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async reviewJobDescriptionDraft(companyId: string, data: JDReviewRequest): Promise<JDReviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/companies/${companyId}/jobs/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  // ── Interviews ──
  async getInterviews(): Promise<InterviewResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getInterviewCandidates(search?: string): Promise<{ id: string; name: string | null; email: string | null; overall_score: number | null }[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/candidates${qs}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getInterview(id: string): Promise<InterviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/${id}`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async createInterview(data: InterviewCreate): Promise<InterviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async updateInterview(id: string, data: Partial<InterviewCreate & { status: string }>): Promise<InterviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async cancelInterview(id: string): Promise<InterviewResponse> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/${id}/cancel`, { method: 'POST' });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getInterviewSlots(): Promise<InterviewSlot[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/slots`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async createInterviewSlot(data: InterviewSlotCreate): Promise<InterviewSlot> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/slots`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async deleteInterviewSlot(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/interviews/slots/${id}`, { method: 'DELETE' });
    if (!res.ok) return handleError(res);
  },

  // ── Notifications ──
  async getNotifications(): Promise<NotificationResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/notifications`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async markNotificationRead(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'POST' });
    if (!res.ok) return handleError(res);
  },

  // ── Activity Logs ──
  async getActivityLogs(): Promise<ActivityLogResponse[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/notifications/activity-logs`);
    if (!res.ok) return handleError(res);
    return res.json();
  },

  // ── Admin ──
  async getFailedTasks(): Promise<FailedTask[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/admin/failed-tasks`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
  async getTaskLogs(): Promise<TaskLog[]> {
    const res = await apiFetch(`${API_BASE_URL}/api/admin/task-logs`);
    if (!res.ok) return handleError(res);
    return res.json();
  },
};
