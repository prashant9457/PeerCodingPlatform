import { AuthView } from '@neondatabase/auth-ui';
import { useLocation } from 'react-router-dom';

export function AuthPage() {
  const { pathname } = useLocation();
  return (
    <div style={{ maxWidth: 440, margin: '32px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <svg height="40" width="40" viewBox="0 0 16 16" fill="var(--color-fg-default)" aria-hidden="true">
          <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06L10.44 8 9.22 6.78a.75.75 0 0 1 0-1.06Zm-4.94 0a.75.75 0 0 1 0 1.06L3.06 8l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Z"/>
        </svg>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 8 }}>PeerProgramming</h1>
      </div>
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 6, padding: 24, background: 'var(--color-canvas-default)' }}>
        <AuthView pathname={pathname} />
      </div>
    </div>
  );
}