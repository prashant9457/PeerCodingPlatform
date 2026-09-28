import "dotenv/config";
import { Pool } from "pg";

console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});