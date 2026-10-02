import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyRun = await client.query(
        "SELECT id FROM _migrations WHERE name = $1;",
        [file]
      );

      if ((alreadyRun.rowCount ?? 0) > 0) {
        console.log(`[migrate] Skipping already executed: ${file}`);
        continue;
      }

      console.log(`[migrate] Executing migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN;");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO _migrations (name) VALUES ($1);",
          [file]
        );
        await client.query("COMMIT;");
        console.log(`[migrate] Successfully executed: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK;");
        console.error(`[migrate] Error executing ${file}:`, err);
        throw err;
      }
    }

    console.log("[migrate] All migrations up to date.");
  } finally {
    client.release();
  }
}

runMigrations()
  .catch((err) => {
    console.error("[migrate] Migration runner failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
