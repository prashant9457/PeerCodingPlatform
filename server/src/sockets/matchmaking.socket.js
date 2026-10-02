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
import { ZodError } from "zod";
import { matchmakingService } from "../matchmaking/matchmaking.service.js";
// ─── Handler registration ─────────────────────────────────────────────────────
export function registerMatchmakingHandlers(io, socket) {
    // ── queue:join ────────────────────────────────────────────────────────────
    socket.on("queue:join", (payload) => {
        const userId = socket.data.userId;
        // 1. Authentication guard
        if (!userId) {
            emitError(socket, "UNAUTHENTICATED", "You must be authenticated to join the queue.");
            return;
        }
        // 2. Validate criteria
        let criteria;
        try {
            criteria = matchmakingService.validateCriteria({
                difficulty: payload.difficulty,
                topic: payload.topic,
            });
        }
        catch (err) {
            if (err instanceof ZodError) {
                const firstIssue = err.issues[0];
                const field = firstIssue?.path[0];
                const code = field === "difficulty" ? "INVALID_DIFFICULTY" : "INVALID_TOPIC";
                emitError(socket, code, firstIssue?.message ?? "Invalid queue criteria.");
            }
            else {
                emitError(socket, "MATCHMAKING_FAILED", "Failed to validate queue criteria.");
            }
            return;
        }
        // 3. Join the queue (replaces existing entry if already queued)
        matchmakingService.joinQueue(userId, socket.id, criteria);
        const joined = { status: "queued" };
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
            const leftPayload = { status: "left" };
            socket.emit("queue:left", leftPayload);
            console.log(`[matchmaking] ${userId} left queue`);
        }
        // If "not_in_queue": silently ignore — idempotent leave is acceptable.
    });
    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (!userId)
            return;
        matchmakingService.handleDisconnect(userId);
        console.log(`[matchmaking] ${userId} disconnected — removed from queue if present`);
    });
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function emitError(socket, code, message) {
    const payload = { code, message };
    socket.emit("matchmaking:error", payload);
}
function emitMatchFound(io, match) {
    const [p1, p2] = match.participants;
    const toP1 = {
        roomId: match.roomId,
        partner: { userId: p2.userId },
        difficulty: match.difficulty,
        ...(match.topic ? { topic: match.topic } : {}),
    };
    const toP2 = {
        roomId: match.roomId,
        partner: { userId: p1.userId },
        difficulty: match.difficulty,
        ...(match.topic ? { topic: match.topic } : {}),
    };
    io.to(p1.socketId).emit("match:found", toP1);
    io.to(p2.socketId).emit("match:found", toP2);
    console.log(`[matchmaking] Match created: room=${match.roomId} ` +
        `users=[${p1.userId}, ${p2.userId}] ` +
        `difficulty=${match.difficulty}${match.topic ? ` topic=${match.topic}` : ""}`);
}
