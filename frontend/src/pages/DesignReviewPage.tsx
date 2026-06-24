import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  api,
  type Annotation,
  type AutoReviewResult,
  type Design,
  type Issue,
  type LessonLearned,
  type Review,
  type ReviewComment,
  type SimilarDesign,
} from '../api/client';
import { ModelViewer } from '../components/ModelViewer';
import { SeverityBadge } from '../components/SeverityBadge';
import { Panel } from '../components/ui';
import { GeometryStatsFromReview } from '../components/GeometryStats3D';
import {
  AUTOREVIEW_OPTIONS,
  COMMENT_TEMPLATES,
  MESH_FILE_TYPES,
  REVIEWER_ROLES,
} from '../constants/formOptions';

export function DesignReviewPage() {
  const { id } = useParams();
  const designId = Number(id);

  const [design, setDesign] = useState<Design | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [similar, setSimilar] = useState<SimilarDesign[]>([]);
  const [relatedLessons, setRelatedLessons] = useState<LessonLearned[]>([]);
  const [autoReview, setAutoReview] = useState<AutoReviewResult | null>(null);
  const [author, setAuthor] = useState<string>(REVIEWER_ROLES[5].value);
  const [commentTemplate, setCommentTemplate] = useState<string>(COMMENT_TEMPLATES[0].value);
  const [commentBody, setCommentBody] = useState('');
  const [autoReviewMode, setAutoReviewMode] = useState<string>(AUTOREVIEW_OPTIONS[0].value);
  const [meshFormat, setMeshFormat] = useState<string>(MESH_FILE_TYPES[0].value);
  const [pageLoading, setPageLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const [designData, reviews, issueData, similarData] = await Promise.all([
        api.getDesign(designId),
        api.listReviews(),
        api.listIssues(designId),
        api.similarDesigns(designId),
      ]);

      setDesign(designData);
      setIssues(issueData);
      setSimilar(similarData);

      const meta = designData.metadata_json as { geometry_summary?: Record<string, unknown> } | null;
      if (meta?.geometry_summary) {
        setAutoReview({
          design_id: designId,
          issues_found: issueData.length,
          issues: issueData,
          geometry_summary: meta.geometry_summary,
          llm_insights: null,
        });
      }

      const activeReview = reviews.find((r) => r.design_id === designId) ?? null;
      setReview(activeReview);

      if (activeReview) {
        const [commentData, annotationData] = await Promise.all([
          api.listComments(activeReview.id),
          api.listAnnotations(activeReview.id),
        ]);
        setComments(commentData);
        setAnnotations(annotationData);
      } else {
        setComments([]);
        setAnnotations([]);
      }

      const lessonQuery = `${designData.name} ${designData.description ?? ''}`;
      setRelatedLessons(await api.searchLessons(lessonQuery));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot connect to API — run docker compose up --build');
      setDesign(null);
    } finally {
      setPageLoading(false);
    }
  }, [designId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ensureReview = async () => {
    if (review) return review;
    const created = await api.createReview({
      design_id: designId,
      title: `Virtual Review — ${design?.name ?? 'Design'}`,
      reviewer_name: author,
    });
    setReview(created);
    return created;
  };

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      setDesign(await api.uploadFile(designId, file));
    } finally {
      setBusy(false);
    }
  };

  const handleAutoReview = async () => {
    setBusy(true);
    try {
      const result = await api.runAutoReview(designId, autoReviewMode === 'full');
      setAutoReview(result);
      setIssues(result.issues);

      const activeReview = await ensureReview();
      for (const issue of result.issues) {
        if (issue.position) {
          await api.addAnnotation(activeReview.id, {
            label: issue.title,
            position_x: issue.position.x,
            position_y: issue.position.y,
            position_z: issue.position.z,
            note: issue.description,
            severity: issue.severity,
            source: 'autoreview',
          });
        }
      }
      setAnnotations(await api.listAnnotations(activeReview.id));
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    setBusy(true);
    try {
      const activeReview = await ensureReview();
      await api.addComment(activeReview.id, { author_name: author, body: commentBody.trim() });
      setCommentBody('');
      setComments(await api.listComments(activeReview.id));
    } finally {
      setBusy(false);
    }
  };

  const handleAnnotate = async (point: { x: number; y: number; z: number }) => {
    const activeReview = await ensureReview();
    await api.addAnnotation(activeReview.id, {
      label: 'Manual flag',
      position_x: point.x,
      position_y: point.y,
      position_z: point.z,
      note: 'Added during virtual review',
      severity: 'info',
      source: 'human',
    });
    setAnnotations(await api.listAnnotations(activeReview.id));
  };

  if (pageLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading 3D design workspace…</p>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="error-state">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <p className="muted">Start backend: <code>docker compose up --build</code></p>
        <button type="button" className="btn-primary" onClick={() => void refresh()}>Retry</button>
        <Link to="/" className="back-link">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page review-page">
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">← Operations Overview</Link>
          <p className="eyebrow">Virtual Design Review · React Three Fiber</p>
          <h1>{design.name}</h1>
          <p>{design.description}</p>
          {design.file_type && (
            <p className="muted mono">
              {design.file_type.toUpperCase()} mesh
              {(design.metadata_json as { issue_count?: number } | null)?.issue_count
                ? ` · ${(design.metadata_json as { issue_count: number }).issue_count} findings`
                : ''}
            </p>
          )}
        </div>
        <div className="action-row action-row-form">
          <label className="field-label compact">
            Mesh format
            <select className="field-select" value={meshFormat} onChange={(e) => setMeshFormat(e.target.value)}>
              {MESH_FILE_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="file-button">
            Upload mesh
            <input
              type="file"
              accept={`.${meshFormat},.stl,.obj,.ply,.glb,.gltf`}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
          </label>
          <label className="field-label compact">
            AutoReview mode
            <select className="field-select" value={autoReviewMode} onChange={(e) => setAutoReviewMode(e.target.value)}>
              {AUTOREVIEW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleAutoReview()}>
            {busy ? 'Running…' : 'Run AutoReview'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="review-layout">
        <ModelViewer
          meshUrl={design.file_type ? api.getMeshUrl(designId) : null}
          issues={issues}
          annotations={annotations}
          onCanvasClick={(p) => void handleAnnotate(p)}
        />

        <aside className="review-sidebar">
          <Panel title="3D Geometry Metrics" subtitle="Volume · bounds · face analysis">
            <GeometryStatsFromReview autoReview={autoReview} />
          </Panel>

          <Panel title="AutoReview Findings" subtitle="Trimesh rule engine · GEO-*">
            {issues.length === 0 && (
              <p className="muted">No findings yet — click Run AutoReview to analyze this design.</p>
            )}
            <ul className="issue-list">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <div className="issue-head">
                    <strong className="mono">{issue.rule_id}</strong>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <p>{issue.title}</p>
                  <small>{issue.description}</small>
                </li>
              ))}
            </ul>
          </Panel>

          {autoReview?.llm_insights && (
            <Panel title="AI Peer Summary" subtitle="Optional LLM narrative layer">
              <pre className="insight-pre">{autoReview.llm_insights}</pre>
            </Panel>
          )}

          <Panel title="Review Thread" subtitle="SME comments · persisted in PostgreSQL">
            <ul className="comment-list">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.author_name}</strong>
                  <p>{comment.body}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => void handleComment(e)} className="comment-form">
              <label className="field-label">
                Reviewer role
                <select className="field-select" value={author} onChange={(e) => setAuthor(e.target.value)}>
                  {REVIEWER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Comment template
                <select
                  className="field-select"
                  value={commentTemplate}
                  onChange={(e) => {
                    setCommentTemplate(e.target.value);
                    if (e.target.value) setCommentBody(e.target.value);
                  }}
                >
                  {COMMENT_TEMPLATES.map((t) => (
                    <option key={t.label} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="SME feedback…"
                rows={3}
              />
              <button type="submit" className="btn-primary" disabled={busy}>Post Comment</button>
            </form>
          </Panel>

          <Panel title="Similar Designs" subtitle="pgvector cosine similarity">
            <ul className="simple-list">
              {similar.map(({ design: match, similarity }) => (
                <li key={match.id}>
                  <Link to={`/designs/${match.id}`}>{match.name}</Link>
                  <span className="muted mono"> {(similarity * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Related Lessons" subtitle="Semantic retrieval">
            <ul className="simple-list">
              {relatedLessons.map((lesson) => (
                <li key={lesson.id}>
                  <strong>{lesson.title}</strong>
                  <p>{lesson.content.slice(0, 120)}…</p>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
