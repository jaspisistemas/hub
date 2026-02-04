import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connect = (url = 'http://localhost:3000') => {
  if (!socket) {
    socket = io(url);
    
    socket.on('connect', () => {
      console.log('WebSocket conectado');
    });
    
    socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
    });
  }
  return socket;
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Orders events
export const onOrderCreated = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('order.created', cb);
};

export const onOrderUpdated = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('order.updated', cb);
};

export const onOrderDeleted = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('order.deleted', cb);
};

// Products events
export const onProductCreated = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('product.created', cb);
};

export const onProductUpdated = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('product.updated', cb);
};

export const onProductDeleted = (cb: (payload: any) => void) => {
  if (!socket) return;
  socket.on('product.deleted', cb);
};

export const getSocket = () => socket;
