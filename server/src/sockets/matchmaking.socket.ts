/**
 * Matchmaking Socket.IO handler.
 *
 * Thin layer: wires Socket.IO events to the matchmaking service.
 * After a match is found the handler resolves the question from the DB
 * (the service itself stays pure/sync — no DB access).
 */

import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";
import { matchmakingService } from "../matchmaking/matchmaking.service.js";
import * as questionService from "../services/question.service.js";
import type {
  QueueJoinPayload,
  QueueJoinedPayload,
  QueueLeftPayload,
  MatchFoundPayload,
  MatchmakingErrorPayload,
  MatchmakingErrorCode,
  Match,
} from "../matchmaking/types.js";

declare module "socket.io" {
  interface SocketData {
    userId: string | undefined;
  }
}

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  // ── queue:join ────────────────────────────────────────────────────────────

  socket.on("queue:join", async (payload: QueueJoinPayload) => {
    const userId = socket.data.userId;

    if (!userId) {
      emitError(socket, "UNAUTHENTICATED", "You must be authenticated to join the queue.");
      return;
    }

    // Validate criteria
    let criteria: ReturnType<typeof matchmakingService.validateCriteria>;
    try {
      criteria = matchmakingService.validateCriteria({
        difficulty: payload.difficulty,
        topic: payload.topic,
        questionSlug: payload.questionSlug,
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

    // Join
    matchmakingService.joinQueue(userId, socket.id, criteria);
    const joined: QueueJoinedPayload = { status: "queued" };
    socket.emit("queue:joined", joined);

    console.log(
      `[matchmaking] ${userId} joined queue ` +
      `(${criteria.difficulty}${criteria.topic ? `, topic=${criteria.topic}` : ""}` +
      `${criteria.questionSlug ? `, preferred=${criteria.questionSlug}` : ""})`
    );

    // Attempt immediate match
    const result = matchmakingService.findMatch(userId);
    if (result.kind !== "matched") return;

    // Resolve question: use preferred slug or fetch random from DB
    let questionSlug = result.match.questionSlug;
    if (!questionSlug) {
      try {
        const question = await questionService.getRandomQuestion(
          result.match.difficulty,
          result.match.topic
        );
        questionSlug = question.slug;
      } catch (err) {
        console.error("[matchmaking] Failed to resolve question:", err);
        emitError(socket, "MATCHMAKING_FAILED", "Could not assign a question to this match.");
        return;
      }
    }

    emitMatchFound(io, result.match, questionSlug);
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

function emitError(socket: Socket, code: MatchmakingErrorCode, message: string): void {
  const payload: MatchmakingErrorPayload = { code, message };
  socket.emit("matchmaking:error", payload);
}

function emitMatchFound(io: Server, match: Match, questionSlug: string): void {
  const [p1, p2] = match.participants;

  const toP1: MatchFoundPayload = {
    roomId: match.roomId,
    partner: { userId: p2.userId },
    difficulty: match.difficulty,
    questionSlug,
    ...(match.topic ? { topic: match.topic } : {}),
  };

  const toP2: MatchFoundPayload = {
    roomId: match.roomId,
    partner: { userId: p1.userId },
    difficulty: match.difficulty,
    questionSlug,
    ...(match.topic ? { topic: match.topic } : {}),
  };

  io.to(p1.socketId).emit("match:found", toP1);
  io.to(p2.socketId).emit("match:found", toP2);

  console.log(
    `[matchmaking] Match: room=${match.roomId} ` +
    `users=[${p1.userId}, ${p2.userId}] ` +
    `question=${questionSlug} difficulty=${match.difficulty}` +
    `${match.topic ? ` topic=${match.topic}` : ""}`
  );
}