import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { questionRoutes } from "./routes/question.routes.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

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

// Question Routes
app.use("/api/questions", questionRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
