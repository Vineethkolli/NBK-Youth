import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socket.on('notification', (data) => {
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.body,
          icon: '/pwa-192x192.png',
        });
      } else {
        console.log('Notification received:', data);
      }
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const joinRoom = (userId) => {
  if (socket) {
    socket.emit('join', userId);
    console.log(`Joined room: ${userId}`);
  }
};

export const leaveRoom = (userId) => {
  if (socket) {
    socket.emit('leave', userId);
    console.log(`Left room: ${userId}`);
  }
};
