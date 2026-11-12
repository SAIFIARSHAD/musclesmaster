import http from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export const initializeSocket = (httpServer: http.Server): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}`, reason);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized. Call initializeSocket first.',
    );
  }

  return io;
};
