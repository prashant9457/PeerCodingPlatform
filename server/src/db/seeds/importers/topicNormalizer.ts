/**
 * Deterministically normalizes a raw topic string into a clean kebab-case identifier.
 * Example:
 *   "Array" -> "array"
 *   "Hash Table" -> "hash-table"
 *   "Two Pointers" -> "two-pointers"
 *   "Binary Search" -> "binary-search"
 *   "Dynamic Programming" -> "dynamic-programming"
 *   "Linked List" -> "linked-list"
 */
export function normalizeTopic(rawTopic: string): string {
  return rawTopic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes an array of raw topic strings, filtering out duplicates and empty strings.
 */
export function normalizeTopics(rawTopics: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const t of rawTopics) {
    const norm = normalizeTopic(t);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      normalized.push(norm);
    }
  }

  return normalized;
}
