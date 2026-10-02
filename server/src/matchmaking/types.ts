import type { Difficulty } from "../types/question.types.js";

// ─── Queue entry ────────────────────────────────────────────────────────────

/**
 * A single user waiting in the matchmaking queue.
 *
 * userId  – stable identity from the authentication layer (socket.data.userId).
 * socketId – the current realtime connection; changes on reconnect.
 */
export interface QueueEntry {
  readonly userId: string;
  readonly socketId: string;
  readonly difficulty: Difficulty;
  /** Normalized (lowercase, trimmed) topic. Undefined means "any topic". */
  readonly topic: string | undefined;
  readonly joinedAt: number;
}

// ─── Match ──────────────────────────────────────────────────────────────────

export interface Participant {
  readonly userId: string;
  readonly socketId: string;
}

export interface Match {
  readonly roomId: string;
  readonly participants: readonly [Participant, Participant];
  readonly difficulty: Difficulty;
  readonly topic: string | undefined;
  readonly createdAt: number;
}

// ─── Results ────────────────────────────────────────────────────────────────

export type JoinResult =
  | { kind: "queued" }
  | { kind: "error"; reason: MatchmakingErrorCode };

export type LeaveResult =
  | { kind: "left" }
  | { kind: "not_in_queue" };

export type FindMatchResult =
  | { kind: "matched"; match: Match }
  | { kind: "waiting" };

// ─── Errors ─────────────────────────────────────────────────────────────────

export type MatchmakingErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_DIFFICULTY"
  | "INVALID_TOPIC"
  | "ALREADY_QUEUED"
  | "MATCHMAKING_FAILED";

// ─── Queue criteria (validated) ─────────────────────────────────────────────

export interface QueueCriteria {
  readonly difficulty: Difficulty;
  readonly topic?: string | undefined;
}

// ─── Socket.IO event payloads ────────────────────────────────────────────────

/** Payload sent by the client on queue:join */
export interface QueueJoinPayload {
  difficulty: unknown;
  topic?: unknown;
}

/** Emitted to the client on queue:joined */
export interface QueueJoinedPayload {
  status: "queued";
}

/** Emitted to the client on queue:left */
export interface QueueLeftPayload {
  status: "left";
}

/** Emitted to both clients on match:found */
export interface MatchFoundPayload {
  roomId: string;
  partner: { userId: string };
  difficulty: Difficulty;
  topic?: string;
}

/** Emitted to the client on matchmaking:error */
export interface MatchmakingErrorPayload {
  code: MatchmakingErrorCode;
  message: string;
}
