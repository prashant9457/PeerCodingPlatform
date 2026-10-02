import http from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = http.createServer(app);

server.listen(env.PORT, async () => {
  console.log(
    `Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`
  );

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});