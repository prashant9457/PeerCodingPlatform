/**
 * Room Socket.IO handler.
 *
 * Handles collaborative coding room events:
 *   room:join      — join the socket.io room for a matched session
 *   code:update    — broadcast code changes to room partner
 *   disconnect     — notify partner when a user leaves
 */

import type { Server, Socket } from "socket.io";

interface RoomJoinPayload {
  roomId: string;
}

interface CodeUpdatePayload {
  roomId: string;
  code: string;
  language: string;
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // ── room:join ─────────────────────────────────────────────────────────────

  socket.on("room:join", ({ roomId }: RoomJoinPayload) => {
    const userId = socket.data.userId;
    if (!userId || !roomId) return;

    socket.join(roomId);

    // Notify existing participants that this user joined
    socket.to(roomId).emit("room:partner-joined", { userId });

    // Confirm to the joiner
    socket.emit("room:joined", { roomId });

    console.log(`[room] ${userId} joined room ${roomId}`);
  });

  // ── code:update ───────────────────────────────────────────────────────────

  socket.on("code:update", ({ roomId, code, language }: CodeUpdatePayload) => {
    const userId = socket.data.userId;
    if (!userId || !roomId) return;

    // Broadcast to all others in the room (not back to sender)
    socket.to(roomId).emit("code:changed", { userId, code, language });
  });

  // ── disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (!userId) return;

    // socket.rooms is a Set; the socket's own id is always in it.
    // Any other room IDs are our named rooms.
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      io.to(roomId).emit("room:partner-left", { userId });
      console.log(`[room] ${userId} left room ${roomId}`);
    }
  });
}
