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

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!name.trim()) return;
    await api.createDesign({ name: name.trim(), description: description.trim() || undefined });
    setName('');
    setDescription('');
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

      <Panel title="New Design" subtitle="Create a design record and upload STL for AutoReview">
        <form className="inline-form" onSubmit={(e) => void handleCreate(e)}>
          <input placeholder="Design name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            placeholder="Description (e.g. bracket with welding features)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Create Design</button>
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
