import express from "express";
import cors from "cors";
import { env } from "./config/env.js";

const app = express();

// Core Middleware
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Peer Programming API is running",
  });
});

export { app };
