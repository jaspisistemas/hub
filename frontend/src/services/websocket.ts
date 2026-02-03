import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connect = (url = 'http://localhost:3000') => {
  if (!socket) {
    socket = io(url);
  }
  return socket;
};

export const onOrderCreated = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('order.created', cb);
};
