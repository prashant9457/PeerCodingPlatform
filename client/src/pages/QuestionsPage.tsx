import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuestions, type QuestionSummary } from '../api/questionApi.js';

export function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchQuestions()
      .then((data) => { if (isMounted) { setQuestions(data); setLoading(false); } })
      .catch((err: Error) => { if (isMounted) { setError(err.message); setLoading(false); } });
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div style={{ padding: '2rem 0', textAlign: 'center', color: '#666' }}>Loading questions...</div>;
  if (error) return (
    <div style={{ padding: '1.5rem', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', color: '#c53030' }}>
      <h3 style={{ marginTop: 0 }}>Unable to load questions</h3>
      <p style={{ margin: 0 }}>{error}</p>
    </div>
  );
  if (questions.length === 0) return <div style={{ padding: '2rem 0', color: '#666' }}><h3>No questions available</h3></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <h2>Questions</h2>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>{questions.length} problems</span>
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Title</th>
              <th style={{ padding: '0.75rem 1rem' }}>Difficulty</th>
              <th style={{ padding: '0.75rem 1rem' }}>Topics</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const diffColor = q.difficulty === 'easy' ? '#22543d' : q.difficulty === 'medium' ? '#744210' : '#742a2a';
              const diffBg = q.difficulty === 'easy' ? '#c6f6d5' : q.difficulty === 'medium' ? '#feebc8' : '#fed7d7';
              return (
                <tr key={q.id || q.slug} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Link to={"/questions/" + q.slug} style={{ color: '#2b6cb0', fontWeight: '500', textDecoration: 'none' }}>{q.title}</Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: diffBg, color: diffColor }}>{q.difficulty}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.9rem' }}>
                    {Array.isArray(q.topics) && q.topics.length > 0 ? q.topics.join(', ') : q.topic || 'u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}