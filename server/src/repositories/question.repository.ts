import { pool } from "../db/pool.js";

export async function findAllQuestions() {
  const result = await pool.query(`
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      topic,
      constraints,
      examples,
      starter_code,
      created_at,
      updated_at
    FROM questions
    ORDER BY created_at DESC;
  `);

  return result.rows;
}