import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchQuestionBySlug, type QuestionDetail } from '../api/questionApi.js';

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  const cls = difficulty === 'easy' ? 'label label-easy' : difficulty === 'medium' ? 'label label-medium' : 'label label-hard';
  return <span className={cls} style={{ textTransform: 'capitalize' }}>{difficulty}</span>;
}

export function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('typescript');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetchQuestionBySlug(slug)
      .then((data) => { if (active) { setQuestion(data); setLoading(false); } })
      .catch((err: Error) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-fg-muted)' }}>Loading…</div>;
  if (error || !question) return (
    <div>
      <Link to="/questions" className="text-muted" style={{ fontSize: 13 }}>← Questions</Link>
      <div className="flash flash-error mt-3">{error || 'Question not found.'}</div>
    </div>
  );

  const starterCode = question.starter_code || question.starterCode || {};
  const langs = Object.keys(starterCode);
  const currentTab = langs.includes(activeTab) ? activeTab : langs[0] || '';

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-fg-muted)' }}>
        <Link to="/questions">Questions</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>{question.title}</span>
      </nav>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{question.title}</h1>
        <DifficultyLabel difficulty={question.difficulty} />
      </div>

      {/* Topics */}
      {Array.isArray(question.topics) && question.topics.length > 0 && (
        <div className="topics-row mb-4">
          {question.topics.map((t) => <span key={t} className="label label-topic">{t}</span>)}
        </div>
      )}

      {/* Description */}
      {question.description && (
        <section style={{ marginBottom: 24, padding: 16, background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: 6 }}>
          <h3>Description</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>{question.description}</div>
        </section>
      )}

      {/* Examples */}
      {Array.isArray(question.examples) && question.examples.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3>Examples</h3>
          {question.examples.map((ex, idx) => (
            <div key={idx} style={{ background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: 6, padding: '12px 16px', marginBottom: 8, fontSize: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-fg-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example {ex.number ?? idx + 1}</div>
              {ex.input && <div style={{ marginBottom: 2 }}><strong>Input:</strong> <code>{ex.input}</code></div>}
              {ex.output && <div style={{ marginBottom: 2 }}><strong>Output:</strong> <code>{ex.output}</code></div>}
              {ex.explanation && <div style={{ color: 'var(--color-fg-muted)', marginTop: 4 }}><strong>Explanation:</strong> {ex.explanation}</div>}
              {ex.text && !ex.input && !ex.output && <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-fg-muted)' }}>{ex.text}</div>}
            </div>
          ))}
        </section>
      )}

      {/* Constraints */}
      {question.constraints && (
        <section style={{ marginBottom: 24 }}>
          <h3>Constraints</h3>
          <div style={{ background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: 6, padding: '12px 16px', whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7 }}>
            {question.constraints}
          </div>
        </section>
      )}

      {/* Starter Code */}
      {langs.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3>Starter Code</h3>
          {/* Language tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border-default)', marginBottom: 0, background: '#161b22', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
            {langs.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  background: lang === currentTab ? '#0d1117' : 'transparent',
                  border: 'none',
                  borderBottom: lang === currentTab ? '2px solid #fd8c73' : '2px solid transparent',
                  color: lang === currentTab ? '#e6edf3' : '#848d97',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'color 0.15s',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
          <pre style={{ borderRadius: '0 0 6px 6px', marginTop: 0 }}>
            <code>{starterCode[currentTab] || ''}</code>
          </pre>
        </section>
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/match" className="btn btn-primary">Start a live session →</Link>
      </div>
    </div>
  );
}