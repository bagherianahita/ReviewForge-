const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type IssueSeverity = 'info' | 'warning' | 'critical';
export type ReviewStatus = 'draft' | 'in_progress' | 'completed';

export interface Design {
  id: number;
  name: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Issue {
  id: number;
  design_id: number;
  rule_id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  position: { x: number; y: number; z: number } | null;
  auto_detected: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  design_id: number;
  title: string;
  status: ReviewStatus;
  reviewer_name: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewComment {
  id: number;
  review_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

export interface Annotation {
  id: number;
  review_id: number;
  label: string;
  position_x: number;
  position_y: number;
  position_z: number;
  note: string | null;
  severity: IssueSeverity;
  source: string;
}

export interface AutoReviewResult {
  design_id: number;
  issues_found: number;
  issues: Issue[];
  geometry_summary: Record<string, unknown>;
  llm_insights: string | null;
}

export interface LessonLearned {
  id: number;
  title: string;
  category: string;
  content: string;
  source_design: string | null;
  tags: string[] | null;
  created_at: string;
  similarity?: number | null;
}

export interface SimilarDesign {
  design: Design;
  similarity: number;
}

export const api = {
  listDesigns: () => request<Design[]>('/designs'),
  createDesign: (payload: { name: string; description?: string }) =>
    request<Design>('/designs', { method: 'POST', body: JSON.stringify(payload) }),
  getDesign: (id: number) => request<Design>(`/designs/${id}`),
  uploadFile: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE}/designs/${id}/upload`, { method: 'POST', body: form });
    if (!response.ok) throw new Error('Upload failed');
    return response.json() as Promise<Design>;
  },
  runAutoReview: (id: number, includeLlm = true) =>
    request<AutoReviewResult>(`/designs/${id}/autoreview`, {
      method: 'POST',
      body: JSON.stringify({ include_llm: includeLlm }),
    }),
  listIssues: (id: number) => request<Issue[]>(`/designs/${id}/issues`),
  similarDesigns: (id: number) => request<SimilarDesign[]>(`/designs/${id}/similar`),
  listReviews: () => request<Review[]>('/reviews'),
  createReview: (payload: { design_id: number; title: string; reviewer_name?: string }) =>
    request<Review>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  listComments: (reviewId: number) => request<ReviewComment[]>(`/reviews/${reviewId}/comments`),
  addComment: (reviewId: number, payload: { author_name: string; body: string }) =>
    request<ReviewComment>(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listAnnotations: (reviewId: number) => request<Annotation[]>(`/reviews/${reviewId}/annotations`),
  addAnnotation: (
    reviewId: number,
    payload: {
      label: string;
      position_x: number;
      position_y: number;
      position_z: number;
      note?: string;
      severity?: IssueSeverity;
      source?: string;
    },
  ) =>
    request<Annotation>(`/reviews/${reviewId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listLessons: () => request<LessonLearned[]>('/lessons'),
  searchLessons: (query: string) =>
    request<LessonLearned[]>('/lessons/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit: 8 }),
    }),
};
