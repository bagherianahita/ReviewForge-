import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Design } from '../api/client';

type DesignMeta = { issue_count?: number; autoreview_status?: string };

export function DashboardPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setDesigns(await api.listDesigns());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await api.createDesign({ name: name.trim(), description: description.trim() || undefined });
    setName('');
    setDescription('');
    await load();
  };

  return (
    <div className="page">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Live Demo · 3 sample engineering designs included</p>
          <h1>Virtual design reviews with AI peer checking</h1>
          <p>
            Open any design below to see a real STL mesh, AutoReview findings, SME comments, and 3D
            annotations — no setup required.
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Sample designs</span>
            <strong>3 STL meshes</strong>
          </div>
          <div className="stat-card">
            <span>AutoReview</span>
            <strong>Pre-run on load</strong>
          </div>
          <div className="stat-card">
            <span>Knowledge base</span>
            <strong>4 lessons</strong>
          </div>
        </div>
      </section>

      {!loading && designs.length > 0 && (
        <section className="panel demo-callout">
          <strong>Start here:</strong> click <em>Engine Mount Bracket</em> to explore a full review with
          geometry findings, threaded comments, and a 3D viewer.
        </section>
      )}

      <section className="panel">
        <h2>New Design</h2>
        <form className="inline-form" onSubmit={(e) => void handleCreate(e)}>
          <input placeholder="Design name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            placeholder="Description (e.g. bracket with welding features)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Create Design</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Design Library</h2>
          {loading && <span className="muted">Loading…</span>}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="design-grid">
          {designs.map((design) => {
            const meta = design.metadata_json as DesignMeta | null;
            return (
              <Link key={design.id} to={`/designs/${design.id}`} className="design-card">
                <div className="design-card-head">
                  <h3>{design.name}</h3>
                  {meta?.issue_count ? (
                    <span className="badge warning">{meta.issue_count} findings</span>
                  ) : (
                    <span className="badge info">New</span>
                  )}
                </div>
                <p>{design.description || 'No description'}</p>
                <div className="design-meta">
                  <span>{design.file_type ? `${design.file_type.toUpperCase()} mesh` : 'No file'}</span>
                  <span>{meta?.autoreview_status === 'complete' ? 'AutoReview ✓' : 'Pending review'}</span>
                </div>
              </Link>
            );
          })}
          {!loading && designs.length === 0 && (
            <p className="muted">No designs yet. Run <code>docker compose up --build</code> to load demo data.</p>
          )}
        </div>
      </section>
    </div>
  );
}
