import { io } from 'socket.io-client';

let socket = null;

export const initiateSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // If no explicit token passed, try localStorage
  const authToken = token || localStorage.getItem('sapphire_chat_token');
  if (!authToken) return null;

  // Connect to the same host or proxy
  socket = io('/', {
    auth: {
      token: authToken
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
