/**
 * Matchmaking Service
 *
 * Pure business logic — no Socket.IO, no Express, no SQL.
 * All operations are synchronous and atomic from the application's
 * perspective (single Node.js event-loop thread).
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { MatchmakingQueue } from "./queue.js";
import type {
  QueueEntry,
  QueueCriteria,
  Match,
  JoinResult,
  LeaveResult,
  FindMatchResult,
} from "./types.js";
import type { Difficulty } from "../types/question.types.js";

// ─── Validation schema ───────────────────────────────────────────────────────

const DIFFICULTY_VALUES = ["easy", "medium", "hard"] as const;

const QueueCriteriaSchema = z.object({
  difficulty: z.enum(DIFFICULTY_VALUES, {
    message: "difficulty must be one of: easy, medium, hard",
  }),
  topic: z
    .string()
    .trim()
    .min(1, "topic must not be empty when provided")
    .max(80, "topic is too long")
    .optional(),
  questionSlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
});

// ─── Service ─────────────────────────────────────────────────────────────────

export class MatchmakingService {
  private readonly queue = new MatchmakingQueue();

  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Parse and validate raw queue criteria from Socket.IO payload.
   * Returns the normalized criteria or throws a ZodError.
   */
  validateCriteria(raw: { difficulty: unknown; topic?: unknown; questionSlug?: unknown }): QueueCriteria {
    const parsed = QueueCriteriaSchema.parse(raw);
    return {
      difficulty: parsed.difficulty as Difficulty,
      topic: parsed.topic ? parsed.topic.toLowerCase() : undefined,
      questionSlug: parsed.questionSlug ?? undefined,
    };
  }

  // ── Queue management ────────────────────────────────────────────────────────

  /**
   * Place a user into the matchmaking queue.
   *
   * - If the user is already queued, their entry is replaced (re-queue).
   * - Returns "queued" always (caller decides whether to then call findMatch).
   */
  joinQueue(userId: string, socketId: string, criteria: QueueCriteria): JoinResult {
    const entry: QueueEntry = {
      userId,
      socketId,
      difficulty: criteria.difficulty,
      topic: criteria.topic,
      questionSlug: criteria.questionSlug,
      joinedAt: Date.now(),
    };

    this.queue.add(entry);
    return { kind: "queued" };
  }

  /**
   * Remove a user from the queue by their stable userId.
   */
  leaveQueue(userId: string): LeaveResult {
    const existed = this.queue.removeByUserId(userId);
    return existed ? { kind: "left" } : { kind: "not_in_queue" };
  }

  /**
   * Called when a socket disconnects.
   * Removes the user from the queue using their stable userId.
   */
  handleDisconnect(userId: string): void {
    this.queue.removeByUserId(userId);
  }

  /** Returns true if the user is currently waiting. */
  isQueued(userId: string): boolean {
    return this.queue.has(userId);
  }

  // ── Matching ────────────────────────────────────────────────────────────────

  /**
   * Attempt to find a compatible partner for the given user.
   *
   * If a match is found:
   *   - Both users are removed from the queue (atomically within the sync block).
   *   - A Match object is returned.
   *
   * If no partner is available, returns { kind: "waiting" }.
   */
  findMatch(userId: string): FindMatchResult {
    const seeker = this.queue.getByUserId(userId);
    if (!seeker) return { kind: "waiting" };

    const partner = this.queue.findCompatible(seeker);
    if (!partner) return { kind: "waiting" };

    // ── Critical section: remove both atomically ──────────────────────────
    this.queue.removeByUserId(seeker.userId);
    this.queue.removeByUserId(partner.userId);

    const match = this.createMatch(seeker, partner);
    return { kind: "matched", match };
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private createMatch(a: QueueEntry, b: QueueEntry): Match {
    const matchedTopic = a.topic ?? b.topic;
    const preferredSlug = a.questionSlug ?? b.questionSlug;

    return {
      roomId: randomUUID(),
      participants: [
        { userId: a.userId, socketId: a.socketId },
        { userId: b.userId, socketId: b.socketId },
      ],
      difficulty: a.difficulty,
      topic: matchedTopic,
      questionSlug: preferredSlug,
      createdAt: Date.now(),
    };
  }

  // ── Diagnostics (test/debug only) ──────────────────────────────────────────

  /** Returns the number of users currently waiting. */
  queueSize(): number {
    return this.queue.size;
  }
}

export const matchmakingService = new MatchmakingService();