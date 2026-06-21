import { useEffect, useState, type FormEvent } from 'react';
import { api, type LessonLearned } from '../api/client';

export function LessonsPage() {
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [query, setQuery] = useState('welding bracket clearance');
  const [results, setResults] = useState<LessonLearned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.listLessons().then((data) => {
      setLessons(data);
      setLoading(false);
    });
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setResults(await api.searchLessons(query));
  };

  return (
    <div className="page">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Knowledge Repository</p>
          <h1>Lessons Learned Search</h1>
          <p>Semantic search over past design feedback — the same pattern CoLab uses to surface insights from prior reviews.</p>
        </div>
      </section>

      <section className="panel">
        <form className="inline-form" onSubmit={(e) => void handleSearch(e)}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons (e.g. weld access, thin wall, pipe routing)"
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {results.length > 0 && (
        <section className="panel">
          <h2>Search Results</h2>
          <div className="lesson-grid">
            {results.map((lesson) => (
              <article key={lesson.id} className="lesson-card">
                <div className="lesson-head">
                  <h3>{lesson.title}</h3>
                  {lesson.similarity != null && (
                    <span className="badge info">{(lesson.similarity * 100).toFixed(0)}% relevant</span>
                  )}
                </div>
                <p className="muted">{lesson.category} · {lesson.source_design}</p>
                <p>{lesson.content}</p>
                <div className="tag-row">
                  {(lesson.tags ?? []).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>All Lessons</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="lesson-grid">
            {lessons.map((lesson) => (
              <article key={lesson.id} className="lesson-card">
                <h3>{lesson.title}</h3>
                <p className="muted">{lesson.category}</p>
                <p>{lesson.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
