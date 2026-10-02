/**
 * Socket.IO client factory.
 * Creates a socket connected to the backend with the user's authenticated userId.
 * The userId is passed as a query param — the dev stub in sockets/index.ts reads it.
 * Replace with JWT auth header when backend JWT middleware is implemented.
 */
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createSocket(userId: string): Socket {
  return io(SOCKET_URL, {
    query: { userId },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
}