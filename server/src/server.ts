import express from "express";
import { pool } from "./db/pool.js";

const app = express();

const PORT = 5000;

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Peer Programming API is running",
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});