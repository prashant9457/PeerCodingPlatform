import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchQuestionBySlug, type QuestionDetail } from '../api/questionApi.js';

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = difficulty === 'easy' ? '#22543d' : difficulty === 'medium' ? '#744210' : '#742a2a';
  const bg = difficulty === 'easy' ? '#c6f6d5' : difficulty === 'medium' ? '#feebc8' : '#fed7d7';
  return <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: bg, color }}>{difficulty}</span>;
}

export function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchQuestionBySlug(slug)
      .then((data) => { if (isMounted) { setQuestion(data); setLoading(false); } })
      .catch((err: Error) => { if (isMounted) { setError(err.message); setLoading(false); } });
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) return <div style={{ padding: '2rem 0', textAlign: 'center', color: '#666' }}>Loading question...</div>;
  if (error || !question) return (
    <div style={{ padding: '1.5rem', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', color: '#c53030' }}>
      <h3 style={{ marginTop: 0 }}>Unable to load question</h3>
      <p style={{ margin: '0 0 0.5rem' }}>{error || 'Question data unavailable.'}</p>
      <Link to="/questions" style={{ color: '#2b6cb0' }}>Back to Questions</Link>
    </div>
  );

  const starterCode = question.starter_code || question.starterCode;

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <Link to="/questions" style={{ color: '#718096', fontSize: '0.9rem', textDecoration: 'none' }}>Questions</Link>
      </div>
      <h1 style={{ marginBottom: '0.5rem' }}>{question.title}</h1>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <DifficultyBadge difficulty={question.difficulty} />
        {Array.isArray(question.topics) && question.topics.length > 0
          ? <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>{question.topics.map((t) => <span key={t} style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', backgroundColor: '#ebf4ff', color: '#2b6cb0', borderRadius: '9999px' }}>{t}</span>)}</div>
          : question.topic ? <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>{question.topic}</span> : null}
      </div>
      {question.description && <section style={{ marginBottom: '1.5rem' }}><h3>Description</h3><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#2d3748' }}>{question.description}</div></section>}
      {Array.isArray(question.examples) && question.examples.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3>Examples</h3>
          {question.examples.map((ex, idx) => (
            <div key={idx} style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
              <strong>Example {ex.number ?? idx + 1}</strong>
              {ex.input && <div style={{ marginTop: '0.4rem' }}><code><strong>Input:</strong> {ex.input}</code></div>}
              {ex.output && <div><code><strong>Output:</strong> {ex.output}</code></div>}
              {ex.explanation && <div style={{ marginTop: '0.3rem', color: '#4a5568', fontSize: '0.92rem' }}><strong>Explanation:</strong> {ex.explanation}</div>}
              {ex.text && !ex.input && !ex.output && <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.4rem', color: '#4a5568' }}>{ex.text}</div>}
            </div>
          ))}
        </section>
      )}
      {question.constraints && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3>Constraints</h3>
          <div style={{ backgroundColor: '#fffaf0', border: '1px solid #fbd38d', borderRadius: '6px', padding: '0.75rem 1rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', color: '#2d3748' }}>{question.constraints}</div>
        </section>
      )}
      {starterCode && Object.keys(starterCode).length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3>Starter Code</h3>
          {Object.entries(starterCode).map(([lang, code]) => (
            <div key={lang} style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize', color: '#4a5568', marginBottom: '0.25rem' }}>{lang}</div>
              <pre style={{ backgroundColor: '#1a202c', color: '#e2e8f0', padding: '0.85rem 1rem', borderRadius: '6px', overflowX: 'auto', fontSize: '0.875rem', margin: 0, fontFamily: 'monospace' }}><code>{code}</code></pre>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}