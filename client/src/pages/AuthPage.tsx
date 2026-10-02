import { AuthView } from '@neondatabase/auth-ui';
import { useLocation } from 'react-router-dom';

export function AuthPage() {
  const { pathname } = useLocation();
  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Account Authentication</h2>
      <AuthView pathname={pathname} />
    </div>
  );
}