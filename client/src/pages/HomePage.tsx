import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../auth/authClient.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DIFFICULTIES = ['any', 'easy', 'medium', 'hard'] as const;
type Difficulty = typeof DIFFICULTIES[number];

function DiffPill({ value, selected, onClick }: { value: Difficulty; selected: boolean; onClick: () => void }) {
  const labelCls = value === 'easy' ? 'label-easy' : value === 'medium' ? 'label-medium' : value === 'hard' ? 'label-hard' : '';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 14px',
        borderRadius: 999,
        border: selected ? '1px solid var(--color-accent-fg)' : '1px solid var(--color-border-default)',
        background: selected ? 'rgba(56,139,253,0.15)' : 'var(--color-canvas-subtle)',
        color: selected ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
        fontFamily: 'var(--sans)',
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        textTransform: 'capitalize',
        transition: 'all 0.12s',
      }}
      className={selected && labelCls ? `label ${labelCls}` : ''}
    >
      {value === 'any' ? 'Any' : value}
    </button>
  );
}

export function HomePage() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<Difficulty>('any');
  const [topic, setTopic] = useState('any');
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available topics from the question list
  useEffect(() => {
    fetch(`${API_BASE}/api/questions`)
      .then((r) => r.json())
      .then((data) => {
        const qs = Array.isArray(data) ? data : data.data || [];
        const set = new Set<string>();
        for (const q of qs) {
          if (Array.isArray(q.topics)) q.topics.forEach((t: string) => set.add(t));
          else if (q.topic) set.add(q.topic);
        }
        setTopics(Array.from(set).sort());
      })
      .catch(() => {});
  }, []);

  const handleCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'any') params.set('difficulty', difficulty);
      if (topic !== 'any') params.set('topic', topic);
      const qs = params.toString() ? '?' + params.toString() : '';

      const res = await fetch(`${API_BASE}/api/questions/random${qs}`);
      if (!res.ok) throw new Error(`No matching question found (${res.status})`);
      const data = await res.json();
      const q = data.data || data;
      if (!q?.slug) throw new Error('Invalid response from server');
      navigate(`/match?slug=${q.slug}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to find a question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Hero */}
      <div style={{ padding: '40px 0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <svg height="28" width="28" viewBox="0 0 16 16" fill="var(--color-accent-fg)" aria-hidden="true">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06L10.44 8 9.22 6.78a.75.75 0 0 1 0-1.06Zm-4.94 0a.75.75 0 0 1 0 1.06L3.06 8l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>PeerProgramming</h1>
        </div>
        <p style={{ fontSize: 15, color: 'var(--color-fg-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Practice with a partner. Get matched, pick a problem, and code together in real time.
        </p>
        <Link to="/questions" className="btn" style={{ fontSize: 13 }}>Browse all questions →</Link>
      </div>

      {/* ── Solve Panel ── */}
      <div style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        {/* Panel header */}
        <div style={{
          background: 'var(--color-canvas-subtle)',
          borderBottom: '1px solid var(--color-border-default)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg height="16" width="16" viewBox="0 0 16 16" fill="var(--color-fg-muted)" aria-hidden="true">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Solve a problem</span>
        </div>

        {/* Panel body */}
        <div style={{ padding: '20px 16px', background: 'var(--color-canvas-default)' }}>
          {/* Difficulty */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Difficulty
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIFFICULTIES.map((d) => (
                <DiffPill key={d} value={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
              ))}
            </div>
          </div>

          {/* Topic */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Topic
            </div>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                background: 'var(--color-canvas-subtle)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 6,
                color: 'var(--color-fg-default)',
                fontFamily: 'var(--sans)',
                fontSize: 14,
                padding: '5px 28px 5px 10px',
                cursor: 'pointer',
                appearance: 'auto',
                minWidth: 160,
              }}
            >
              <option value="any">Any topic</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="flash flash-error" style={{ marginBottom: 12, fontSize: 13 }}>{error}</div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {session?.user ? (
              <button className="btn btn-primary" onClick={handleCode} disabled={loading} style={{ gap: 6 }}>
                {loading ? 'Finding…' : (
                  <>
                    <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
                    </svg>
                    Code
                  </>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/auth" className="btn btn-primary">Sign in to code</Link>
                <span style={{ fontSize: 13, color: 'var(--color-fg-subtle)' }}>Authentication required</span>
              </div>
            )}
            {difficulty === 'any' && topic === 'any' && (
              <span style={{ fontSize: 12, color: 'var(--color-fg-subtle)' }}>Random question will be selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        {[
          { icon: '📚', title: '40 curated problems', desc: 'Easy, Medium, and Hard across arrays, trees, graphs, DP, and more.' },
          { icon: '🔐', title: 'Neon Auth', desc: 'Secure managed authentication — no password hashing required.' },
          { icon: '🤝', title: 'Live sessions', desc: 'Real-time peer matching and collaborative coding. Coming soon.' },
        ].map((f) => (
          <div key={f.title} style={{ border: '1px solid var(--color-border-muted)', borderRadius: 6, padding: 14, background: 'var(--color-canvas-subtle)' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-fg-muted)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}