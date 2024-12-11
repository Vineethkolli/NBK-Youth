import axios from 'axios';
import { API_URL } from './config';

export async function subscribeToPushNotifications(retry = 3) {
  try {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker not supported');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission denied');

    const registration = await navigator.serviceWorker.ready;
    const { data: { publicKey } } = await axios.get(`${API_URL}/api/notifications/vapidPublicKey`);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    await axios.post(`${API_URL}/api/notifications/subscribe`, subscription, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (retry > 0) {
      console.warn('Retrying subscription:', error);
      return subscribeToPushNotifications(retry - 1);
    }
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}


export function showNotification(title, body, options = {}) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });
    });
  }
}
