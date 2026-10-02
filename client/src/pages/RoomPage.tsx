import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useSearchParams, useNavigate, Link } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { authClient } from '../auth/authClient.js';
import { createSocket } from '../lib/socket.js';
import { fetchQuestionBySlug, type QuestionDetail } from '../api/questionApi.js';

interface LocationState {
  questionSlug?: string;
  difficulty?: string;
  topic?: string;
  partnerUserId?: string;
  myUserId?: string;
}

type PartnerStatus = 'waiting' | 'connected' | 'disconnected';

const LANGUAGES = ['typescript', 'javascript', 'python', 'java', 'cpp'] as const;
type Language = typeof LANGUAGES[number];

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  const cls = difficulty === 'easy' ? 'label label-easy' : difficulty === 'medium' ? 'label label-medium' : 'label label-hard';
  return <span className={cls} style={{ textTransform: 'capitalize' }}>{difficulty}</span>;
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};
  const { data: session } = authClient.useSession();

  // Read from state or query params (so refresh retains context)
  const questionSlug = state.questionSlug || searchParams.get('question') || undefined;
  const partnerUserId = state.partnerUserId || searchParams.get('partner') || undefined;
  const difficulty = state.difficulty || searchParams.get('difficulty') || undefined;
  const topic = state.topic || searchParams.get('topic') || undefined;
  const myUserId = state.myUserId ?? session?.user?.id ?? session?.user?.email ?? 'me';

  // ── State ─────────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [myCode, setMyCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [myLanguage, setMyLanguage] = useState<Language>('typescript');
  const [partnerLanguage, setPartnerLanguage] = useState<Language>('typescript');
  const [partnerVisible, setPartnerVisible] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>('waiting');

  const socketRef = useRef<Socket | null>(null);
  const emitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch question ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!questionSlug) {
      setQuestionError('No question assigned to this room.');
      setQuestionLoading(false);
      return;
    }
    let active = true;
    fetchQuestionBySlug(questionSlug)
      .then((q) => {
        if (active) {
          setQuestion(q);
          setQuestionLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setQuestionError(err.message);
          setQuestionLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [questionSlug]);

  // Set starter code when question loads
  useEffect(() => {
    if (!question) return;
    const starterCode = question.starter_code || question.starterCode || {};
    if (starterCode[myLanguage]) {
      setMyCode(starterCode[myLanguage] || '');
    }
  }, [question, myLanguage]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !myUserId || !session?.user) return;

    const socket = createSocket(myUserId);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', { roomId });
    });

    socket.on('room:partner-joined', ({ userId }: { userId: string }) => {
      console.log(`[room] partner joined: ${userId}`);
      setPartnerStatus('connected');
    });

    socket.on('room:partner-left', ({ userId }: { userId: string }) => {
      console.log(`[room] partner left: ${userId}`);
      setPartnerStatus('disconnected');
    });

    socket.on('code:changed', ({ code, language }: { userId: string; code: string; language: Language }) => {
      setPartnerCode(code);
      if (language) setPartnerLanguage(language);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, myUserId, session]);

  // ── Code broadcast (debounced 250ms) ──────────────────────────────────────
  const broadcastCode = useCallback(
    (code: string, language: Language) => {
      if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
      emitTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('code:update', { roomId, code, language });
      }, 250);
    },
    [roomId]
  );

  const handleMyCodeChange = (value: string) => {
    setMyCode(value);
    broadcastCode(value, myLanguage);
  };

  const handleMyLanguageChange = (lang: Language) => {
    setMyLanguage(lang);
    if (question) {
      const starterCode = question.starter_code || question.starterCode || {};
      if (starterCode[lang]) {
        setMyCode(starterCode[lang] || '');
        broadcastCode(starterCode[lang] || '', lang);
        return;
      }
    }
    broadcastCode(myCode, lang);
  };

  const handleLeave = () => {
    socketRef.current?.disconnect();
    navigate('/', { replace: true });
  };

  if (!roomId) {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Invalid Room</h2>
        <Link to="/" className="btn btn-primary">Home</Link>
      </div>
    );
  }

  // Layout widths:
  // With partner: Left (35%), Middle Question (30%), Right Partner (35%)
  // Hidden partner: Left (55%), Middle Question (45%)
  const myEditorWidth = partnerVisible ? '35%' : '55%';
  const questionWidth = partnerVisible ? '30%' : '45%';
  const partnerEditorWidth = '35%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 44,
          background: 'var(--color-canvas-subtle)',
          borderBottom: '1px solid var(--color-border-default)',
          flexShrink: 0,
        }}
      >
        <button className="btn btn-sm" onClick={handleLeave} style={{ fontSize: 12 }}>
          ← Leave
        </button>

        {question ? (
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-fg-default)' }}>
            {question.title}
          </span>
        ) : (
          <span style={{ color: 'var(--color-fg-muted)', fontSize: 13 }}>Loading problem…</span>
        )}

        {difficulty && <DifficultyLabel difficulty={difficulty} />}
        {topic && <span className="label label-topic">{topic}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Partner status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  partnerStatus === 'connected'
                    ? '#3fb950'
                    : partnerStatus === 'disconnected'
                    ? '#f85149'
                    : '#d29922',
              }}
            />
            <span style={{ color: 'var(--color-fg-muted)' }}>
              {partnerStatus === 'connected'
                ? `${partnerUserId ?? 'Partner'} connected`
                : partnerStatus === 'disconnected'
                ? `${partnerUserId ?? 'Partner'} left`
                : 'Waiting for partner…'}
            </span>
          </div>

          {/* Toggle Partner Editor Button */}
          <button
            className="btn btn-sm"
            onClick={() => setPartnerVisible((v) => !v)}
            style={{ fontSize: 12 }}
            title="Toggle visibility of the partner's code window"
          >
            {partnerVisible ? 'Hide partner editor' : 'Show partner editor'}
          </button>
        </div>
      </div>

      {/* ── 3-Panel Split Area ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 1. Left Window: Your Editor */}
        <div
          style={{
            width: myEditorWidth,
            minWidth: 260,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-border-default)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: '#161b22',
              borderBottom: '1px solid #30363d',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>
              Your Code ({myUserId})
            </span>
            <div style={{ marginLeft: 'auto' }}>
              <select
                value={myLanguage}
                onChange={(e) => handleMyLanguageChange(e.target.value as Language)}
                style={{
                  background: '#21262d',
                  border: '1px solid #30363d',
                  color: '#e6edf3',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  padding: '2px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={myCode}
            onChange={(e) => handleMyCodeChange(e.target.value)}
            spellCheck={false}
            placeholder={`// Write your ${myLanguage} solution here…`}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: '#0d1117',
              color: '#e6edf3',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              lineHeight: 1.6,
              padding: '12px 16px',
              tabSize: 2,
            }}
          />
        </div>

        {/* 2. Middle Window: Question Description */}
        <div
          style={{
            width: questionWidth,
            minWidth: 240,
            display: 'flex',
            flexDirection: 'column',
            borderRight: partnerVisible ? '1px solid var(--color-border-default)' : 'none',
            overflow: 'hidden',
            background: 'var(--color-canvas-default)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border-muted)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-fg-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: 'var(--color-canvas-subtle)',
            }}
          >
            Problem Description
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', fontSize: 13, lineHeight: 1.7 }}>
            {questionLoading && <p style={{ color: 'var(--color-fg-muted)' }}>Loading question…</p>}
            {questionError && <div className="flash flash-error">{questionError}</div>}
            {question && (
              <>
                <h3 style={{ marginBottom: 8, fontSize: 15 }}>{question.title}</h3>
                {Array.isArray(question.topics) && question.topics.length > 0 && (
                  <div className="topics-row mb-3">
                    {question.topics.map((t) => (
                      <span key={t} className="label label-topic" style={{ fontSize: 11 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {question.description && (
                  <p style={{ color: 'var(--color-fg-default)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                    {question.description}
                  </p>
                )}
                {Array.isArray(question.examples) && question.examples.length > 0 && (
                  <>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--color-fg-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Examples
                    </div>
                    {question.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--color-canvas-subtle)',
                          borderRadius: 4,
                          padding: '8px 10px',
                          marginBottom: 8,
                          fontSize: 12,
                        }}
                      >
                        {ex.input && (
                          <div>
                            <strong>Input:</strong> <code>{ex.input}</code>
                          </div>
                        )}
                        {ex.output && (
                          <div>
                            <strong>Output:</strong> <code>{ex.output}</code>
                          </div>
                        )}
                        {ex.explanation && (
                          <div style={{ color: 'var(--color-fg-muted)', marginTop: 2 }}>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {question.constraints && (
                  <>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        marginTop: 10,
                        color: 'var(--color-fg-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Constraints
                    </div>
                    <pre style={{ fontSize: 11, padding: '8px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {question.constraints}
                    </pre>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3. Right Window: Partner's Editor (Visible / Toggleable) */}
        {partnerVisible && (
          <div
            style={{
              width: partnerEditorWidth,
              minWidth: 260,
              display: 'flex',
              flexDirection: 'column',
              background: '#0a0e14',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: '#161b22',
                borderBottom: '1px solid #30363d',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: '#848d97' }}>
                Partner ({partnerUserId ?? 'Partner'})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                {partnerStatus === 'waiting' && (
                  <span style={{ fontSize: 11, color: '#d29922' }}>waiting…</span>
                )}
                {partnerStatus === 'disconnected' && (
                  <span style={{ fontSize: 11, color: '#f85149' }}>disconnected</span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: '#848d97',
                    fontFamily: 'var(--mono)',
                    background: '#21262d',
                    padding: '1px 6px',
                    borderRadius: 3,
                  }}
                >
                  {partnerLanguage}
                </span>
              </div>
            </div>
            <textarea
              value={partnerCode}
              readOnly
              spellCheck={false}
              placeholder="Partner's code will be streamed here in real time…"
              style={{
                flex: 1,
                resize: 'none',
                border: 'none',
                outline: 'none',
                background: '#0a0e14',
                color: '#848d97',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                lineHeight: 1.6,
                padding: '12px 16px',
                cursor: 'default',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}