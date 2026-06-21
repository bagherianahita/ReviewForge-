import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Design } from '../api/client';

export function DashboardPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setDesigns(await api.listDesigns());
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
          <p className="eyebrow">Portfolio Project · CoLab Stack</p>
          <h1>Virtual design reviews with AI peer checking</h1>
          <p>
            Upload 3D models, run AutoReview against geometry rules, collaborate with SMEs, and search
            institutional knowledge — built with Python, React, Postgres, and LLM integration.
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Backend</span>
            <strong>FastAPI + Postgres</strong>
          </div>
          <div className="stat-card">
            <span>3D Pipeline</span>
            <strong>Trimesh + Three.js</strong>
          </div>
          <div className="stat-card">
            <span>AI Layer</span>
            <strong>OpenAI + Vector Search</strong>
          </div>
        </div>
      </section>

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
          {designs.map((design) => (
            <Link key={design.id} to={`/designs/${design.id}`} className="design-card">
              <h3>{design.name}</h3>
              <p>{design.description || 'No description'}</p>
              <div className="design-meta">
                <span>{design.file_type ? design.file_type.toUpperCase() : 'No file'}</span>
                <span>{new Date(design.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {!loading && designs.length === 0 && <p className="muted">No designs yet. Create one above.</p>}
        </div>
      </section>
    </div>
  );
}
