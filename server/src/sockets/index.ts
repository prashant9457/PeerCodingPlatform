/**
 * Socket.IO server initialization.
 *
 * Attaches a Socket.IO server to the existing HTTP server.
 * Registers per-connection handlers.
 *
 * Authentication note:
 *   socket.data.userId is currently populated via a stub that reads a
 *   query parameter (?userId=xxx) for local development.
 *
 *   BEFORE PRODUCTION: Replace the stub with real JWT verification using
 *   the jose library and NEON_AUTH_JWKS_URL already configured in env.
 *   The verified sub/userId claim from the JWT should populate socket.data.userId.
 */

import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerMatchmakingHandlers } from "./matchmaking.socket.js";

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // ── Authentication middleware ────────────────────────────────────────────
  //
  // TODO (next task): Verify the Neon Auth JWT from the Authorization header
  // using jose + NEON_AUTH_JWKS_URL, extract the `sub` claim as userId.
  //
  // DEVELOPMENT STUB:
  // The client passes ?userId=xxx as a socket connection query param.
  // This is intentionally NOT trusted in production — it exists only to
  // unblock frontend development before JWT verification is wired.
  //
  io.use((socket, next) => {
    const queryUserId =
      typeof socket.handshake.query.userId === "string"
        ? socket.handshake.query.userId.trim()
        : undefined;

    if (queryUserId) {
      socket.data.userId = queryUserId;
    } else {
      // userId will be undefined; matchmaking handlers will reject the socket.
      socket.data.userId = undefined;
    }

    next();
  });

  // ── Connection handling ──────────────────────────────────────────────────

  io.on("connection", (socket) => {
    console.log(
      `[socket.io] connect  socketId=${socket.id}  userId=${socket.data.userId ?? "(unauthenticated)"}`
    );

    registerMatchmakingHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(
        `[socket.io] disconnect  socketId=${socket.id}  userId=${socket.data.userId ?? "(unauthenticated)"}  reason=${reason}`
      );
    });
  });

  return io;
}
