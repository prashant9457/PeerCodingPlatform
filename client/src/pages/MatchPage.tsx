import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchQuestionBySlug, type QuestionDetail } from '../api/questionApi.js';

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  const cls = difficulty === 'easy' ? 'label label-easy' : difficulty === 'medium' ? 'label label-medium' : 'label label-hard';
  return <span className={cls} style={{ textTransform: 'capitalize' }}>{difficulty}</span>;
}

export function MatchPage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    fetchQuestionBySlug(slug)
      .then((data) => { if (active) { setQuestion(data); setLoading(false); } })
      .catch((err: Error) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Live Session</h2>
        <p style={{ color: 'var(--color-fg-muted)', fontSize: 14 }}>
          You will be matched with a peer and solve this problem together in real time.
        </p>
      </div>

      {/* Question card */}
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{
          background: 'var(--color-canvas-subtle)',
          borderBottom: '1px solid var(--color-border-default)',
          padding: '10px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-fg-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Problem
        </div>

        <div style={{ padding: '16px' }}>
          {loading && (
            <div style={{ color: 'var(--color-fg-muted)', fontSize: 14 }}>Loading question…</div>
          )}
          {error && (
            <div className="flash flash-error">{error}</div>
          )}
          {!loading && !error && question && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Link to={"/questions/" + question.slug} style={{ fontWeight: 600, fontSize: 16 }}>
                  {question.title}
                </Link>
                <DifficultyLabel difficulty={question.difficulty} />
              </div>
              {Array.isArray(question.topics) && question.topics.length > 0 && (
                <div className="topics-row mb-3">
                  {question.topics.map((t) => (
                    <span key={t} className="label label-topic">{t}</span>
                  ))}
                </div>
              )}
              {question.description && (
                <p style={{ fontSize: 13, color: 'var(--color-fg-muted)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {question.description}
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <Link to={"/questions/" + question.slug} className="btn btn-sm">View problem →</Link>
              </div>
            </div>
          )}
          {!loading && !error && !question && !slug && (
            <div style={{ color: 'var(--color-fg-muted)', fontSize: 14 }}>
              A random question will be selected when a match is found.
            </div>
          )}
        </div>
      </div>

      {/* Match status */}
      <div style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'var(--color-canvas-subtle)',
        marginBottom: 24,
      }}>
        {/* Pulse animation */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#238636',
            boxShadow: '0 0 0 0 rgba(35,134,54,0.4)',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Matchmaking coming soon</div>
          <div style={{ fontSize: 13, color: 'var(--color-fg-muted)' }}>
            Real-time peer matching via Socket.IO is under development. For now, practice solo.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(35,134,54,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(35,134,54,0); }
          100% { box-shadow: 0 0 0 0 rgba(35,134,54,0); }
        }
      `}</style>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/" className="btn">← Back to home</Link>
        <Link to="/questions" className="btn">Browse questions</Link>
      </div>
    </div>
  );
}