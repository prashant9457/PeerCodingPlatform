import { Link } from 'react-router-dom';
import { authClient } from '../auth/authClient.js';

export function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ padding: '48px 0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <svg height="32" width="32" viewBox="0 0 16 16" fill="var(--color-accent-fg)" aria-hidden="true">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06L10.44 8 9.22 6.78a.75.75 0 0 1 0-1.06Zm-4.94 0a.75.75 0 0 1 0 1.06L3.06 8l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>PeerProgramming</h1>
        </div>
        <p style={{ fontSize: 16, color: 'var(--color-fg-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          A collaborative, real-time peer coding platform. Practice with curated LeetCode problems,
          get matched with a partner, and solve problems together in an authenticated live session.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/questions" className="btn btn-primary">Explore questions</Link>
          {session?.user ? (
            <Link to="/match" className="btn">Find a match</Link>
          ) : (
            <Link to="/auth" className="btn">Sign in to match</Link>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-default)', margin: '8px 0 32px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { icon: 'u{1F4DA}', title: '40 curated problems', desc: 'Handpicked problems across Easy, Medium, and Hard difficulties.' },
          { icon: 'u{1F510}', title: 'Authenticated sessions', desc: 'Managed by Neon Auth — secure email sign-in out of the box.' },
          { icon: 'u{1F91D}', title: 'Live matchmaking', desc: 'Get paired with a peer in real time and collaborate on a shared coding session.' },
        ].map((f) => (
          <div key={f.title} style={{ border: '1px solid var(--color-border-default)', borderRadius: 6, padding: 16, background: 'var(--color-canvas-subtle)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-fg-muted)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}