import { Link, Outlet, useLocation } from 'react-router-dom';
import { authClient } from '../../auth/authClient.js';

function OcticonCode() {
  return (
    <svg height="20" width="20" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06L10.44 8 9.22 6.78a.75.75 0 0 1 0-1.06Zm-4.94 0a.75.75 0 0 1 0 1.06L3.06 8l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Z"/>
    </svg>
  );
}

export function AppLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { pathname } = useLocation();

  const navLink = (to: string, label: string) => (
    <Link to={to} className={`${pathname === to || pathname.startsWith(to + '/') ? 'active' : ''}`}>{label}</Link>
  );

  const isFullWidth = pathname.startsWith('/room');

  return (
    <>
      <header className="gh-header">
        <Link to="/" className="gh-header-logo">
          <OcticonCode />
          PeerProgramming
        </Link>

        <nav className="gh-header-nav">
          {navLink('/questions', 'Questions')}
          {navLink('/match', 'Match')}
        </nav>

        <div className="gh-header-actions">
          {isPending ? (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>…</span>
          ) : session?.user ? (
            <div className="gh-header-user">
              <span id="user-display">{session.user.email || session.user.name}</span>
              <button
                id="sign-out-btn"
                className="btn-header"
                type="button"
                onClick={async () => { await authClient.signOut(); }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-header" id="sign-in-btn">Sign in</Link>
          )}
        </div>
      </header>

      {isFullWidth ? (
        <Outlet />
      ) : (
        <div className="page-container">
          <Outlet />
        </div>
      )}
    </>
  );
}