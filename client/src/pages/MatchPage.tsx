import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authClient } from '../auth/authClient.js';
import { createSocket } from '../lib/socket.js';
import type { Socket } from 'socket.io-client';

type QueueState = 'idle' | 'connecting' | 'queued' | 'matched' | 'error';

export function MatchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const difficulty = (searchParams.get('difficulty') || 'easy') as 'easy' | 'medium' | 'hard';
  const topic = searchParams.get('topic') || undefined;
  // If user arrived from a specific question page, carry that preference
  const questionSlug = searchParams.get('slug') || undefined;

  const [queueState, setQueueState] = useState<QueueState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMatchedRef = useRef(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) return;

    const userId = session.user.id ?? session.user.email ?? 'unknown';
    const socket = createSocket(userId);
    socketRef.current = socket;
    setQueueState('connecting');

    socket.on('connect', () => {
      setQueueState('queued');
      setWaitSeconds(0);
      timerRef.current = setInterval(() => setWaitSeconds((s) => s + 1), 1000);

      socket.emit('queue:join', {
        difficulty,
        ...(topic ? { topic } : {}),
        ...(questionSlug ? { questionSlug } : {}),
      });
    });

    socket.on('queue:joined', () => {
      setQueueState('queued');
    });

    socket.on('match:found', (data: {
      roomId: string;
      partner: { userId: string };
      difficulty: string;
      topic?: string;
      questionSlug: string;
    }) => {
      isMatchedRef.current = true;
      setQueueState('matched');
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off();

      const params = new URLSearchParams({
        question: data.questionSlug,
        partner: data.partner.userId,
        difficulty: data.difficulty,
      });
      if (data.topic) params.set('topic', data.topic);

      navigate(`/room/${data.roomId}?${params.toString()}`, {
        state: {
          questionSlug: data.questionSlug,
          difficulty: data.difficulty,
          topic: data.topic,
          partnerUserId: data.partner.userId,
          myUserId: userId,
        },
        replace: true,
      });
    });

    socket.on('matchmaking:error', (err: { code: string; message: string }) => {
      setQueueState('error');
      setErrorMsg(err.message);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    socket.on('connect_error', () => {
      setQueueState('error');
      setErrorMsg('Could not connect to the server. Is the backend running?');
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isMatchedRef.current) {
        socket.emit('queue:leave');
      }
      socket.disconnect();
    };
  }, [isPending, session]);

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isMatchedRef.current) {
      socketRef.current?.emit('queue:leave');
    }
    socketRef.current?.disconnect();
    navigate('/', { replace: true });
  };

  const diffColor = difficulty === 'easy' ? 'label-easy' : difficulty === 'medium' ? 'label-medium' : 'label-hard';

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isPending && !session?.user) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Sign in required</h2>
        <p style={{ color: 'var(--color-fg-muted)', marginBottom: 20 }}>
          You need to be signed in to join the matchmaking queue.
        </p>
        <Link to="/auth" className="btn btn-primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Finding a partner</h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`label ${diffColor}`} style={{ textTransform: 'capitalize' }}>{difficulty}</span>
          {topic && <span className="label label-topic">{topic}</span>}
          {questionSlug && <span style={{ fontSize: 12, color: 'var(--color-fg-subtle)' }}>preferred: {questionSlug}</span>}
        </div>
      </div>

      {/* Status card */}
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ background: 'var(--color-canvas-subtle)', borderBottom: '1px solid var(--color-border-default)', padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Queue status
        </div>
        <div style={{ padding: 24, textAlign: 'center' }}>
          {queueState === 'connecting' && (
            <p style={{ color: 'var(--color-fg-muted)' }}>Connecting to server…</p>
          )}

          {queueState === 'queued' && (
            <>
              {/* Pulsing dots */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#238636',
                    animation: `pulse-dot 1.4s ${i * 0.2}s ease-in-out infinite`,
                    opacity: 0.8,
                  }} />
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Waiting for a partner…</div>
              <div style={{ color: 'var(--color-fg-muted)', fontSize: 13, marginBottom: 20 }}>
                {waitSeconds < 60
                  ? `${waitSeconds}s elapsed`
                  : `${Math.floor(waitSeconds / 60)}m ${waitSeconds % 60}s elapsed`}
              </div>
              <button className="btn" onClick={handleCancel} style={{ fontSize: 13 }}>
                Cancel
              </button>
            </>
          )}

          {queueState === 'matched' && (
            <div style={{ color: 'var(--color-success-fg)', fontWeight: 600, fontSize: 16 }}>
              ✓ Match found! Entering room…
            </div>
          )}

          {queueState === 'error' && (
            <>
              <div className="flash flash-error" style={{ marginBottom: 16, textAlign: 'left' }}>{errorMsg}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Link to="/" className="btn">← Home</Link>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
              </div>
            </>
          )}

          {queueState === 'idle' && isPending && (
            <p style={{ color: 'var(--color-fg-muted)' }}>Loading session…</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-fg-subtle)' }}>
        Matching on difficulty + topic for fastest pairing.
        {questionSlug && ' Your question preference will be used if possible.'}
      </p>
    </div>
  );
}