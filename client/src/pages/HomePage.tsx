import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>PeerProgramming</h1>
      <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '1.5rem' }}>
        A collaborative real-time peer coding platform with authenticated sessions, curated problem sets, and interactive coding interviews.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/questions"><button style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>Explore Questions</button></Link>
        <Link to="/match"><button style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>Find a Match</button></Link>
        <Link to="/auth"><button style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>Sign In / Sign Up</button></Link>
      </div>
    </div>
  );
}