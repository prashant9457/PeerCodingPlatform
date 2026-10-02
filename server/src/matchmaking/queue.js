/**
 * In-memory matchmaking queue.
 *
 * Backed by a `Map<userId, QueueEntry>` so that:
 *   - lookup by userId is O(1)         → duplicate check, disconnect removal
 *   - iteration for compatible match is O(n) → acceptable for MVP scale
 *
 * NOTE: This queue is process-local. When horizontal scaling is introduced
 * (multiple Node.js instances), replace this with a shared store (Redis,
 * PostgreSQL advisory locks, or a dedicated matchmaking service).
 */
export class MatchmakingQueue {
    /**
     * Key   = userId (stable, authentication-layer identity)
     * Value = QueueEntry
     */
    entries = new Map();
    /** Add or replace a user's queue entry. */
    add(entry) {
        this.entries.set(entry.userId, entry);
    }
    /** Remove a user by their stable userId. Returns true if the entry existed. */
    removeByUserId(userId) {
        return this.entries.delete(userId);
    }
    /** Returns the queue entry for a userId, or undefined if not queued. */
    getByUserId(userId) {
        return this.entries.get(userId);
    }
    /** Returns true if the user is currently waiting. */
    has(userId) {
        return this.entries.has(userId);
    }
    /**
     * Find the first queued user compatible with the given criteria.
     * The seeker is excluded from results.
     */
    findCompatible(seeker) {
        for (const candidate of this.entries.values()) {
            if (candidate.userId === seeker.userId)
                continue;
            if (isCompatible(seeker, candidate))
                return candidate;
        }
        return undefined;
    }
    /** Current number of users waiting. */
    get size() {
        return this.entries.size;
    }
    /** Snapshot of all entries (for diagnostics/tests only). */
    allEntries() {
        return Array.from(this.entries.values());
    }
}
// ─── Compatibility check ─────────────────────────────────────────────────────
/**
 * Two queue entries are compatible when:
 *
 * 1. Difficulty matches exactly.
 * 2. Topic rule (topics are already normalized to lowercase):
 *    - Both specified a topic  → topics must be equal.
 *    - Neither specified       → compatible.
 *    - One specified, one did not → compatible (general matching).
 */
function isCompatible(a, b) {
    if (a.difficulty !== b.difficulty)
        return false;
    const aHasTopic = a.topic !== undefined;
    const bHasTopic = b.topic !== undefined;
    if (aHasTopic && bHasTopic) {
        return a.topic === b.topic;
    }
    // one or both have no topic preference → compatible
    return true;
}
