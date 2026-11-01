import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// Single shared socket instance for the whole app — connected lazily
// the first time it's actually needed (see hooks/useSocket.js).
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});