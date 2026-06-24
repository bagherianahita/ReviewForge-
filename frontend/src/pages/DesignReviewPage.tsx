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
import { Panel, StatusPill } from '../components/ui';

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
  const [author, setAuthor] = useState('You');
  const [commentBody, setCommentBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [designData, reviews, issueData, similarData] = await Promise.all([
      api.getDesign(designId),
      api.listReviews(),
      api.listIssues(designId),
      api.similarDesigns(designId),
    ]);

    setDesign(designData);
    setIssues(issueData);
    setSimilar(similarData);

    const activeReview = reviews.find((r) => r.design_id === designId) ?? null;
    setReview(activeReview);

    if (activeReview) {
      const [commentData, annotationData] = await Promise.all([
        api.listComments(activeReview.id),
        api.listAnnotations(activeReview.id),
      ]);
      setComments(commentData);
      setAnnotations(annotationData);
    }

    const lessonQuery = `${designData.name} ${designData.description ?? ''}`;
    setRelatedLessons(await api.searchLessons(lessonQuery));
  }, [designId]);

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'));
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
      const result = await api.runAutoReview(designId);
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

  if (!design) {
    return <div className="page"><p className="muted">Loading design…</p></div>;
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
        <div className="action-row">
          {issues.length > 0 && (
            <StatusPill
              status={issues.some((i) => i.severity === 'critical') ? 'critical' : 'warning'}
              label={`${issues.length} findings`}
            />
          )}
          <label className="file-button">
            Upload STL/OBJ/GLB
            <input
              type="file"
              accept=".stl,.obj,.ply,.glb,.gltf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
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
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add SME feedback…"
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
