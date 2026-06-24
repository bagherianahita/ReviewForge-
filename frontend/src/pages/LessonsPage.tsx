import { useEffect, useState, type FormEvent } from 'react';
import { api, type LessonLearned } from '../api/client';
import { KpiTile, Panel, StatusPill } from '../components/ui';
import { LESSON_SEARCH_PRESETS } from '../constants/formOptions';

const DEFAULT_QUERY = LESSON_SEARCH_PRESETS[0].value;

export function LessonsPage() {
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [results, setResults] = useState<LessonLearned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [allLessons, searchResults] = await Promise.all([
        api.listLessons(),
        api.searchLessons(DEFAULT_QUERY),
      ]);
      setLessons(allLessons);
      setResults(searchResults);
      setLoading(false);
    })();
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setResults(await api.searchLessons(query));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Knowledge Repository</p>
          <h1>Lessons Learned Search</h1>
          <p>Semantic retrieval via pgvector cosine similarity</p>
        </div>
        <KpiTile label="Indexed Lessons" value={lessons.length} accent="nominal" />
      </div>

      <Panel title="Semantic Search" subtitle="Select a preset query or customize — pgvector cosine similarity">
        <form className="form-grid search-form-grid" onSubmit={(e) => void handleSearch(e)}>
          <label className="field-label">
            Search preset
            <select
              className="field-select"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            >
              {LESSON_SEARCH_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Custom query
            <input
              className="field-select"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Or type custom search…"
            />
          </label>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </Panel>

      {loading && <p className="muted">Loading knowledge base…</p>}

      {results.length > 0 && (
        <Panel title="Search Results" subtitle={`${results.length} matches ranked by cosine similarity`}>
          <div className="lesson-grid">
            {results.map((lesson) => (
              <article key={lesson.id} className="lesson-card mes-lesson-card">
                <div className="lesson-head">
                  <h3>{lesson.title}</h3>
                  {lesson.similarity != null && (
                    <StatusPill status="nominal" label={`${(lesson.similarity * 100).toFixed(0)}% match`} />
                  )}
                </div>
                <p className="lesson-category">{lesson.category}</p>
                <p>{lesson.content}</p>
                <div className="tag-row">
                  {(lesson.tags ?? []).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="All Lessons" subtitle="Pre-seeded institutional knowledge base">
        <div className="lesson-grid">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="lesson-card mes-lesson-card">
              <div className="lesson-head">
                <h3>{lesson.title}</h3>
                <span className="tag">{lesson.category}</span>
              </div>
              <p>{lesson.content}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
