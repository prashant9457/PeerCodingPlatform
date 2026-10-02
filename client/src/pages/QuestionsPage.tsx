import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuestions, type QuestionSummary } from '../api/questionApi.js';

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  const cls = difficulty === 'easy' ? 'label label-easy' : difficulty === 'medium' ? 'label label-medium' : 'label label-hard';
  return <span className={cls} style={{ textTransform: 'capitalize' }}>{difficulty}</span>;
}

export function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    let active = true;
    fetchQuestions()
      .then((data) => { if (active) { setQuestions(data); setLoading(false); } })
      .catch((err: Error) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const filtered = filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter);

  if (loading) return <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-fg-muted)' }}>Loading questions…</div>;
  if (error) return <div className="flash flash-error"><strong>Error:</strong> {error}</div>;

  const counts = { easy: questions.filter(q => q.difficulty === 'easy').length, medium: questions.filter(q => q.difficulty === 'medium').length, hard: questions.filter(q => q.difficulty === 'hard').length };

  return (
    <div>
      {/* Page heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Questions</h2>
          <p className="text-muted" style={{ fontSize: 13 }}>{questions.length} problems total</p>
        </div>
        <Link to="/match" className="btn btn-primary btn-sm">Find a match</Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--color-border-default)', paddingBottom: 0 }}>
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontSize: 14,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              color: filter === d ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
              fontWeight: filter === d ? 600 : 400,
              borderBottom: filter === d ? '2px solid #fd8c73' : '2px solid transparent',
              marginBottom: -1,
              borderRadius: 0,
            }}
          >
            {d === 'all' ? `All ${questions.length}` : `${d.charAt(0).toUpperCase() + d.slice(1)} ${counts[d]}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="gh-table-wrap">
        <table className="gh-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Title</th>
              <th style={{ width: '15%' }}>Difficulty</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id || q.slug}>
                <td>
                  <Link to={"/questions/" + q.slug} style={{ fontWeight: 500 }}>{q.title}</Link>
                </td>
                <td><DifficultyLabel difficulty={q.difficulty} /></td>
                <td>
                  <div className="topics-row">
                    {(Array.isArray(q.topics) && q.topics.length > 0 ? q.topics : [q.topic].filter(Boolean)).slice(0, 3).map((t) => (
                      <span key={t} className="label label-topic">{t}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}