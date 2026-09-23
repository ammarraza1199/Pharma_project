import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const socketBaseUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/api\/?$/, '')
  : window.location.origin;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(socketBaseUrl, {
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to GENQUANTAA Real-Time Socket Server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error (will retry):', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });
  }
  return socket;
};

export const socketInstance = getSocket();
