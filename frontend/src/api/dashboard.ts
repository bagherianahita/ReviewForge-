export type DashboardSummary = {
  kpis: {
    total_designs: number;
    designs_with_mesh: number;
    total_issues: number;
    autoreview_complete: number;
    active_reviews: number;
    total_lessons: number;
    sme_comments: number;
    annotations: number;
  };
  severity_distribution: { name: string; value: number; key: string }[];
  rule_distribution: { rule_id: string; count: number }[];
  review_status: { status: string; count: number }[];
  lesson_categories: { category: string; count: number }[];
  designs: {
    id: number;
    name: string;
    description: string | null;
    file_type: string | null;
    issue_count: number;
    autoreview_status: string;
    critical_count: number;
    warning_count: number;
  }[];
  pipeline_health: 'nominal' | 'degraded' | 'alert';
};
