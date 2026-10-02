import { Link, Outlet } from 'react-router-dom';
import { authClient } from '../../auth/authClient.js';

export function AppLayout() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'none', color: '#111' }}>PeerProgramming</Link>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/">Home</Link>
            <Link to="/questions">Questions</Link>
            <Link to="/match">Match</Link>
            <Link to="/auth">Auth</Link>
          </nav>
        </div>
        <div>
          {isPending ? (
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Loading...</span>
          ) : session?.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span id="user-display" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{session.user.email || session.user.name || 'Authenticated User'}</span>
              <button id="sign-out-btn" type="button" onClick={async () => { await authClient.signOut(); }} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" style={{ textDecoration: 'none' }}>
              <button id="sign-in-btn" type="button" style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}>Sign In</button>
            </Link>
          )}
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  );
}