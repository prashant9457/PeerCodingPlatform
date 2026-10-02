import { Link } from 'react-router-dom';

export function MatchPage() {
  return (
    <div style={{ maxWidth: 600, margin: '32px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
      <h2 style={{ marginBottom: 8 }}>Matchmaking</h2>
      <p style={{ color: 'var(--color-fg-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
        Real-time peer matching is coming soon. You will be paired with another authenticated user
        and dropped into a shared coding session on the same problem.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link to="/questions" className="btn btn-primary">Browse questions</Link>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    </div>
  );
}