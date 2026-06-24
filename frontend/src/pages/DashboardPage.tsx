import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardSummary } from '../api/dashboard';
import {
  LessonCategoryChart,
  ReviewStatusChart,
  RuleChart,
  SeverityChart,
} from '../components/charts/ReviewCharts';
import { ReviewPipelineDiagram } from '../components/ReviewPipelineDiagram';
import { KpiTile, Panel, StatusPill } from '../components/ui';
import {
  DESIGN_CATEGORIES,
  DESIGN_TEMPLATES,
  MESH_FILE_TYPES,
} from '../constants/formOptions';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [category, setCategory] = useState<string>(DESIGN_CATEGORIES[0]);
  const [meshType, setMeshType] = useState<string>(MESH_FILE_TYPES[0].value);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = DESIGN_TEMPLATES[templateIndex];

  const load = async () => {
    try {
      setSummary(await api.getDashboard());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    await api.createDesign({
      name: selectedTemplate.name,
      description: `[${category}] ${selectedTemplate.description} · mesh: ${meshType.toUpperCase()}`,
    });
    await load();
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Initializing design review platform…</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="error-state">
        <h2>Platform Connection Error</h2>
        <p>{error}</p>
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const { kpis, designs, pipeline_health } = summary;
  const healthLabel =
    pipeline_health === 'alert' ? 'System Alert' : pipeline_health === 'degraded' ? 'Degraded' : 'Nominal';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Operations Overview</h1>
          <p>Virtual design review command center · AutoReview &amp; knowledge retrieval</p>
        </div>
        <StatusPill status={pipeline_health} label={healthLabel} pulse={pipeline_health !== 'nominal'} />
      </div>

      <div className="kpi-grid">
        <KpiTile label="Design Library" value={kpis.total_designs} unit="designs" accent="neutral" />
        <KpiTile label="STL Meshes" value={kpis.designs_with_mesh} unit="loaded" accent="nominal" />
        <KpiTile
          label="AutoReview Findings"
          value={kpis.total_issues}
          unit="issues"
          accent={kpis.total_issues > 5 ? 'degraded' : 'neutral'}
        />
        <KpiTile label="AutoReview Complete" value={kpis.autoreview_complete} unit="designs" accent="nominal" />
        <KpiTile label="Active Reviews" value={kpis.active_reviews} unit="sessions" accent="neutral" />
        <KpiTile label="SME Comments" value={kpis.sme_comments} unit="posted" accent="neutral" />
        <KpiTile label="3D Annotations" value={kpis.annotations} unit="markers" accent="neutral" />
        <KpiTile label="Lessons Learned" value={kpis.total_lessons} unit="indexed" accent="nominal" />
      </div>

      <ReviewPipelineDiagram />

      <div className="chart-grid-2">
        <SeverityChart data={summary.severity_distribution} />
        <RuleChart data={summary.rule_distribution} />
      </div>

      <div className="chart-grid-2">
        <ReviewStatusChart data={summary.review_status} />
        <LessonCategoryChart data={summary.lesson_categories} />
      </div>

      <Panel title="New Design" subtitle="Select template, category, and mesh type — all fields have defaults">
        <form className="form-grid" onSubmit={(e) => void handleCreate(e)}>
          <label className="field-label">
            Design template
            <select
              className="field-select"
              value={templateIndex}
              onChange={(e) => setTemplateIndex(Number(e.target.value))}
            >
              {DESIGN_TEMPLATES.map((t, i) => (
                <option key={t.name} value={i}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Engineering category
            <select className="field-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {DESIGN_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Expected mesh format
            <select className="field-select" value={meshType} onChange={(e) => setMeshType(e.target.value)}>
              {MESH_FILE_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <div className="template-preview">
            <p className="mono"><strong>{selectedTemplate.name}</strong></p>
            <p className="muted">{selectedTemplate.description}</p>
          </div>
          <button type="submit" className="btn-primary btn-block">Create Design</button>
        </form>
      </Panel>

      <Panel title="Design Library" subtitle="Click a design to open 3D viewer, findings, and SME review thread">
        <div className="design-grid">
          {designs.map((design) => (
            <Link key={design.id} to={`/designs/${design.id}`} className="design-card mes-design-card">
              <div className="design-card-head">
                <h3>{design.name}</h3>
                {design.issue_count > 0 ? (
                  <StatusPill
                    status={design.critical_count > 0 ? 'critical' : 'warning'}
                    label={`${design.issue_count} findings`}
                  />
                ) : (
                  <StatusPill status="nominal" label="New" />
                )}
              </div>
              <p>{design.description || 'No description'}</p>
              <div className="design-meta">
                <span className="mono">{design.file_type ? `${design.file_type.toUpperCase()} mesh` : 'No file'}</span>
                <span>
                  {design.autoreview_status === 'complete' ? 'AutoReview ✓' : 'Pending review'}
                </span>
              </div>
              {(design.critical_count > 0 || design.warning_count > 0) && (
                <div className="finding-bars">
                  {design.critical_count > 0 && (
                    <span className="finding-chip critical">{design.critical_count} critical</span>
                  )}
                  {design.warning_count > 0 && (
                    <span className="finding-chip warning">{design.warning_count} warning</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </Panel>

      <section className="demo-callout mes-callout">
        <strong>Demo tour:</strong> Open <em>Engine Mount Bracket</em> → view GEO-001/GEO-002 findings on the STL mesh →
        post an SME comment → search <code>welding bracket</code> in Lessons Learned.
      </section>
    </div>
  );
}
