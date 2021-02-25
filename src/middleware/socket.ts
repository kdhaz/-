import { Server } from 'http';
import websocket from 'socket.io';

let socket: websocket.Server;

export const initWebSocket = (server: Server): void => {
  socket = new websocket.Server(server, {
    path: '/chat',
    serveClient: false,
    allowEIO3: true,
    cors: { origin: true, credentials: true },
  });
  socket.on('connection', (client: websocket.Socket) => {
    console.log('connected', client.id);
    client.join('zoom');
  });
  socket.on('disconnect', () => {
    console.log('closed');
  });
};
