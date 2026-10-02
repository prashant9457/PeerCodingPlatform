import { pool } from "../db/pool.js";
import type {
  Question,
  CreateQuestionInput,
  QuestionFilterParams,
} from "../types/question.types.js";

export async function upsertQuestion(input: CreateQuestionInput): Promise<Question> {
  const result = await pool.query<Question>(
    `
    INSERT INTO questions (
      title,
      slug,
      description,
      difficulty,
      topic,
      topics,
      constraints,
      examples,
      starter_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      difficulty = EXCLUDED.difficulty,
      topic = EXCLUDED.topic,
      topics = EXCLUDED.topics,
      constraints = EXCLUDED.constraints,
      examples = EXCLUDED.examples,
      starter_code = EXCLUDED.starter_code,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      input.title,
      input.slug,
      input.description,
      input.difficulty,
      input.topic,
      input.topics,
      input.constraints ?? null,
      JSON.stringify(input.examples ?? []),
      JSON.stringify(input.starter_code ?? {}),
    ]
  );

  return result.rows[0]!;
}

export async function findAllQuestions(
  filters: QuestionFilterParams = {}
): Promise<Question[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.difficulty) {
    conditions.push(`difficulty = $${paramIndex++}`);
    params.push(filters.difficulty);
  }

  if (filters.topic) {
    conditions.push(
      `(topic = $${paramIndex} OR $${paramIndex} = ANY(topics))`
    );
    params.push(filters.topic);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let paginationClause = "";
  if (filters.limit) {
    paginationClause += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
  }
  if (filters.offset) {
    paginationClause += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);
  }

  const query = `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      topic,
      topics,
      constraints,
      examples,
      starter_code,
      created_at,
      updated_at
    FROM questions
    ${whereClause}
    ORDER BY created_at DESC
    ${paginationClause};
  `;

  const result = await pool.query<Question>(query, params);
  return result.rows;
}

export async function findQuestionBySlug(slug: string): Promise<Question | null> {
  const result = await pool.query<Question>(
    `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      topic,
      topics,
      constraints,
      examples,
      starter_code,
      created_at,
      updated_at
    FROM questions
    WHERE slug = $1;
    `,
    [slug]
  );

  return result.rows[0] ?? null;
}

export async function findQuestionById(id: string): Promise<Question | null> {
  const result = await pool.query<Question>(
    `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      topic,
      topics,
      constraints,
      examples,
      starter_code,
      created_at,
      updated_at
    FROM questions
    WHERE id = $1;
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function findRandomQuestion(
  difficulty?: string,
  topic?: string
): Promise<Question | null> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (difficulty) {
    conditions.push(`difficulty = $${paramIndex++}`);
    params.push(difficulty);
  }

  if (topic) {
    conditions.push(
      `(topic = $${paramIndex} OR $${paramIndex} = ANY(topics))`
    );
    params.push(topic);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      topic,
      topics,
      constraints,
      examples,
      starter_code,
      created_at,
      updated_at
    FROM questions
    ${whereClause}
    ORDER BY RANDOM()
    LIMIT 1;
  `;

  const result = await pool.query<Question>(query, params);
  return result.rows[0] ?? null;
}