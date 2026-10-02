/**
 * Matchmaking Socket.IO handler.
 *
 * Responsibilities (thin layer only):
 *   - Wire Socket.IO events to the matchmaking service.
 *   - Extract userId from socket.data (authentication layer).
 *   - Emit structured responses to clients.
 *   - Delegate all business logic to MatchmakingService.
 *
 * NO matchmaking logic lives here.
 */

import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";
import { matchmakingService } from "../matchmaking/matchmaking.service.js";
import type {
  QueueJoinPayload,
  QueueJoinedPayload,
  QueueLeftPayload,
  MatchFoundPayload,
  MatchmakingErrorPayload,
  MatchmakingErrorCode,
} from "../matchmaking/types.js";
import type { Match } from "../matchmaking/types.js";

// ─── Socket.IO data augmentation ─────────────────────────────────────────────
// The authentication layer is expected to populate socket.data.userId.
// Declared here so the rest of the handler is fully typed.

declare module "socket.io" {
  interface SocketData {
    userId: string | undefined;
  }
}

// ─── Handler registration ─────────────────────────────────────────────────────

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  // ── queue:join ────────────────────────────────────────────────────────────

  socket.on("queue:join", (payload: QueueJoinPayload) => {
    const userId = socket.data.userId;

    // 1. Authentication guard
    if (!userId) {
      emitError(socket, "UNAUTHENTICATED", "You must be authenticated to join the queue.");
      return;
    }

    // 2. Validate criteria
    let criteria: ReturnType<typeof matchmakingService.validateCriteria>;
    try {
      criteria = matchmakingService.validateCriteria({
        difficulty: payload.difficulty,
        topic: payload.topic,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const field = firstIssue?.path[0];
        const code: MatchmakingErrorCode =
          field === "difficulty" ? "INVALID_DIFFICULTY" : "INVALID_TOPIC";
        emitError(socket, code, firstIssue?.message ?? "Invalid queue criteria.");
      } else {
        emitError(socket, "MATCHMAKING_FAILED", "Failed to validate queue criteria.");
      }
      return;
    }

    // 3. Join the queue (replaces existing entry if already queued)
    matchmakingService.joinQueue(userId, socket.id, criteria);
    const joined: QueueJoinedPayload = { status: "queued" };
    socket.emit("queue:joined", joined);

    console.log(`[matchmaking] ${userId} joined queue (${criteria.difficulty}${criteria.topic ? `, ${criteria.topic}` : ""})`);

    // 4. Attempt immediate match
    const result = matchmakingService.findMatch(userId);
    if (result.kind === "matched") {
      emitMatchFound(io, result.match);
    }
  });

  // ── queue:leave ───────────────────────────────────────────────────────────

  socket.on("queue:leave", () => {
    const userId = socket.data.userId;
    if (!userId) {
      emitError(socket, "UNAUTHENTICATED", "You must be authenticated.");
      return;
    }

    const result = matchmakingService.leaveQueue(userId);
    if (result.kind === "left") {
      const leftPayload: QueueLeftPayload = { status: "left" };
      socket.emit("queue:left", leftPayload);
      console.log(`[matchmaking] ${userId} left queue`);
    }
    // If "not_in_queue": silently ignore — idempotent leave is acceptable.
  });

  // ── disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (!userId) return;

    matchmakingService.handleDisconnect(userId);
    console.log(`[matchmaking] ${userId} disconnected — removed from queue if present`);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emitError(
  socket: Socket,
  code: MatchmakingErrorCode,
  message: string
): void {
  const payload: MatchmakingErrorPayload = { code, message };
  socket.emit("matchmaking:error", payload);
}

function emitMatchFound(io: Server, match: Match): void {
  const [p1, p2] = match.participants;

  const toP1: MatchFoundPayload = {
    roomId: match.roomId,
    partner: { userId: p2.userId },
    difficulty: match.difficulty,
    ...(match.topic ? { topic: match.topic } : {}),
  };

  const toP2: MatchFoundPayload = {
    roomId: match.roomId,
    partner: { userId: p1.userId },
    difficulty: match.difficulty,
    ...(match.topic ? { topic: match.topic } : {}),
  };

  io.to(p1.socketId).emit("match:found", toP1);
  io.to(p2.socketId).emit("match:found", toP2);

  console.log(
    `[matchmaking] Match created: room=${match.roomId} ` +
    `users=[${p1.userId}, ${p2.userId}] ` +
    `difficulty=${match.difficulty}${match.topic ? ` topic=${match.topic}` : ""}`
  );
}
