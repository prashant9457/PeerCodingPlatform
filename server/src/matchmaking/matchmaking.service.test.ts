/**
 * Unit tests for MatchmakingService.
 *
 * Pure service tests — no Socket.IO, no Express, no database.
 * Each test creates a fresh MatchmakingService instance to prevent state leakage.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MatchmakingService } from "./matchmaking.service.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeService() {
  return new MatchmakingService();
}

const USER_A = { userId: "user-alice", socketId: "socket-a1" };
const USER_B = { userId: "user-bob", socketId: "socket-b1" };
const USER_C = { userId: "user-carol", socketId: "socket-c1" };

const EASY = { difficulty: "easy" as const };
const MEDIUM = { difficulty: "medium" as const };
const EASY_ARRAY = { difficulty: "easy" as const, topic: "array" };
const EASY_GRAPHS = { difficulty: "easy" as const, topic: "graphs" };

// ─── Validation ───────────────────────────────────────────────────────────────

describe("validateCriteria", () => {
  it("accepts valid difficulty with no topic", () => {
    const svc = makeService();
    const result = svc.validateCriteria({ difficulty: "medium" });
    expect(result).toEqual({ difficulty: "medium", topic: undefined });
  });

  it("accepts valid difficulty with a topic", () => {
    const svc = makeService();
    const result = svc.validateCriteria({ difficulty: "hard", topic: "trees" });
    expect(result).toEqual({ difficulty: "hard", topic: "trees" });
  });

  it("normalizes topic to lowercase", () => {
    const svc = makeService();
    const result = svc.validateCriteria({ difficulty: "easy", topic: "Graphs" });
    expect(result.topic).toBe("graphs");
  });

  it("trims whitespace from topic", () => {
    const svc = makeService();
    const result = svc.validateCriteria({ difficulty: "easy", topic: "  array  " });
    expect(result.topic).toBe("array");
  });

  it("rejects an invalid difficulty", () => {
    const svc = makeService();
    expect(() => svc.validateCriteria({ difficulty: "extreme" })).toThrow();
  });

  it("rejects a missing difficulty", () => {
    const svc = makeService();
    expect(() => svc.validateCriteria({ difficulty: undefined })).toThrow();
  });

  it("rejects an empty topic string", () => {
    const svc = makeService();
    expect(() => svc.validateCriteria({ difficulty: "easy", topic: "" })).toThrow();
  });

  it("rejects a topic that exceeds 80 characters", () => {
    const svc = makeService();
    const longTopic = "a".repeat(81);
    expect(() => svc.validateCriteria({ difficulty: "easy", topic: longTopic })).toThrow();
  });
});

// ─── Queue management ─────────────────────────────────────────────────────────

describe("joinQueue / isQueued", () => {
  it("places a user in the queue", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    expect(svc.isQueued(USER_A.userId)).toBe(true);
    expect(svc.queueSize()).toBe(1);
  });

  it("replaces an existing entry when the same user joins again (re-queue)", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, "old-socket", EASY);
    svc.joinQueue(USER_A.userId, "new-socket", MEDIUM);
    expect(svc.queueSize()).toBe(1);
    expect(svc.isQueued(USER_A.userId)).toBe(true);
  });

  it("allows multiple distinct users to queue", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    expect(svc.queueSize()).toBe(2);
  });
});

describe("leaveQueue", () => {
  it("removes a queued user", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    const result = svc.leaveQueue(USER_A.userId);
    expect(result.kind).toBe("left");
    expect(svc.isQueued(USER_A.userId)).toBe(false);
  });

  it("returns not_in_queue when user was not waiting", () => {
    const svc = makeService();
    const result = svc.leaveQueue("phantom-user");
    expect(result.kind).toBe("not_in_queue");
  });
});

describe("handleDisconnect", () => {
  it("removes the user from the queue on disconnect", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.handleDisconnect(USER_A.userId);
    expect(svc.isQueued(USER_A.userId)).toBe(false);
    expect(svc.queueSize()).toBe(0);
  });

  it("is a no-op when the user was not queued", () => {
    const svc = makeService();
    expect(() => svc.handleDisconnect("ghost-user")).not.toThrow();
  });
});

// ─── Matching rules ────────────────────────────────────────────────────────────

describe("findMatch — compatibility rules", () => {
  it("matches two users with the same difficulty and no topic", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
  });

  it("does NOT match users with different difficulties", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, MEDIUM);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("waiting");
  });

  it("matches two users with the same difficulty AND same topic", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY_ARRAY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY_ARRAY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
  });

  it("does NOT match two users with the same difficulty but different topics", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY_ARRAY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY_GRAPHS);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("waiting");
  });

  it("matches a user with a topic to a user without a topic (general matching)", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY_ARRAY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY); // no topic
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
  });

  it("matches two users both without a topic", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
  });

  it("returns waiting when no compatible partner exists", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("waiting");
  });

  it("returns waiting when user is not in the queue", () => {
    const svc = makeService();
    const result = svc.findMatch("not-queued");
    expect(result.kind).toBe("waiting");
  });
});

describe("findMatch — post-match state", () => {
  it("removes both matched users from the queue", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    svc.findMatch(USER_A.userId);
    expect(svc.isQueued(USER_A.userId)).toBe(false);
    expect(svc.isQueued(USER_B.userId)).toBe(false);
    expect(svc.queueSize()).toBe(0);
  });

  it("the same user cannot be matched twice", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    svc.findMatch(USER_A.userId);
    // After matching, USER_A is gone — a second call finds nothing
    const second = svc.findMatch(USER_A.userId);
    expect(second.kind).toBe("waiting");
  });

  it("match contains correct roomId and both participant userIds", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY_ARRAY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY_ARRAY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
    if (result.kind !== "matched") return;

    const { match } = result;
    expect(typeof match.roomId).toBe("string");
    expect(match.roomId.length).toBeGreaterThan(0);

    const userIds = match.participants.map((p) => p.userId);
    expect(userIds).toContain(USER_A.userId);
    expect(userIds).toContain(USER_B.userId);
  });

  it("preserves socketIds for both participants in the match", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
    if (result.kind !== "matched") return;

    const socketIds = result.match.participants.map((p) => p.socketId);
    expect(socketIds).toContain(USER_A.socketId);
    expect(socketIds).toContain(USER_B.socketId);
  });

  it("a third user waiting still matches after first two are taken", () => {
    const svc = makeService();
    svc.joinQueue(USER_A.userId, USER_A.socketId, EASY);
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    svc.joinQueue(USER_C.userId, USER_C.socketId, EASY);

    svc.findMatch(USER_A.userId); // A matches B; C still waiting
    expect(svc.isQueued(USER_C.userId)).toBe(true);
    expect(svc.queueSize()).toBe(1);
  });
});

// ─── Identity model ───────────────────────────────────────────────────────────

describe("identity model — userId vs socketId", () => {
  it("identifies a reconnecting user by userId, not old socketId", () => {
    const svc = makeService();
    // User A connects with socket-a1
    svc.joinQueue(USER_A.userId, "socket-a1", EASY);
    // User A reconnects with a new socket
    svc.joinQueue(USER_A.userId, "socket-a2", EASY);

    // Queue still has only one entry for USER_A
    expect(svc.queueSize()).toBe(1);

    // B joins, they match A (with the updated socketId)
    svc.joinQueue(USER_B.userId, USER_B.socketId, EASY);
    const result = svc.findMatch(USER_A.userId);
    expect(result.kind).toBe("matched");
    if (result.kind !== "matched") return;

    const aParticipant = result.match.participants.find(
      (p) => p.userId === USER_A.userId
    );
    // Ensure the match carries the NEW socket, not the old one
    expect(aParticipant?.socketId).toBe("socket-a2");
  });
});
