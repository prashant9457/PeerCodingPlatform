import { z } from "zod";
import { normalizeTopics } from "./topicNormalizer.js";
import type {
  CreateQuestionInput,
  Difficulty,
  StarterCodeMap,
  ExampleCase,
} from "../../../types/question.types.js";

// 1. Raw LeetCode problem schema from neenza/leetcode-problems
export const RawLeetCodeProblemSchema = z.object({
  title: z.string().min(1),
  problem_slug: z.string().min(1),
  difficulty: z.string().min(1),
  description: z.string().default(""),
  topics: z.array(z.string()).default([]),
  examples: z
    .array(
      z.object({
        example_num: z.number().optional(),
        example_text: z.string().default(""),
        images: z.array(z.string()).default([]),
      })
    )
    .default([]),
  constraints: z.array(z.string()).default([]),
  code_snippets: z.record(z.string(), z.string()).default({}),
});

export type RawLeetCodeProblem = z.infer<typeof RawLeetCodeProblemSchema>;

// 2. Domain Validated Question Schema
export const ValidatedQuestionSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().min(1),
  topics: z.array(z.string()).min(1),
  constraints: z.string().nullable(),
  examples: z.array(
    z.object({
      number: z.number().optional(),
      text: z.string(),
      images: z.array(z.string()).default([]),
    })
  ),
  starter_code: z.record(z.string(), z.string()),
});

export type ValidatedQuestion = z.infer<typeof ValidatedQuestionSchema>;

/**
 * Normalizes difficulty strings: "Easy" -> "easy", "Medium" -> "medium", "Hard" -> "hard"
 */
function normalizeDifficulty(diff: string): Difficulty {
  const lower = diff.trim().toLowerCase();
  if (lower === "easy" || lower === "medium" || lower === "hard") {
    return lower;
  }
  throw new Error(`Unsupported difficulty value: "${diff}"`);
}

/**
 * Transforms and normalizes a raw LeetCode problem object into our validated domain schema.
 */
export function normalizeLeetCodeProblem(rawData: unknown): CreateQuestionInput {
  // Parse raw JSON with Zod
  const raw = RawLeetCodeProblemSchema.parse(rawData);

  // Normalize difficulty
  const difficulty = normalizeDifficulty(raw.difficulty);

  // Normalize topics
  const topics = normalizeTopics(raw.topics);
  if (topics.length === 0) {
    // Fallback if no topic provided in raw dataset
    topics.push("algorithms");
  }
  const primaryTopic = topics[0]!;

  // Clean description - if raw description ends with trailing "Example 1:\n... Constraints:", keep description clean
  const description = raw.description.trim() || raw.title;

  // Format constraints as newline-separated text
  const constraints =
    raw.constraints.length > 0 ? raw.constraints.join("\n") : null;

  // Format examples safely preserving text and images
  const examples: ExampleCase[] = raw.examples.map((ex, idx) => ({
    number: ex.example_num ?? idx + 1,
    text: ex.example_text,
    images: ex.images,
  }));

  // Format starter code for target languages
  const targetLanguages = [
    "cpp",
    "java",
    "python",
    "javascript",
    "typescript",
  ] as const;

  const starterCode: StarterCodeMap = {};
  for (const lang of targetLanguages) {
    if (lang === "python") {
      const code = raw.code_snippets["python3"] || raw.code_snippets["python"];
      if (code) starterCode["python"] = code;
    } else {
      const code = raw.code_snippets[lang];
      if (code) starterCode[lang] = code;
    }
  }

  const unvalidated = {
    title: raw.title.trim(),
    slug: raw.problem_slug.trim(),
    description,
    difficulty,
    topic: primaryTopic,
    topics,
    constraints,
    examples,
    starter_code: starterCode,
  };

  // Validate with Zod domain schema
  return ValidatedQuestionSchema.parse(unvalidated);
}
