import axios from 'axios';
import { API_URL } from './config';

export async function subscribeToPushNotifications() {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    // Make sure service worker is ready
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID public key from the server
    const { data } = await axios.get(`${API_URL}/api/notifications/vapidPublicKey`);
    const publicKey = data.publicKey;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    // Send subscription data to the server
    await axios.post(`${API_URL}/api/notifications/subscribe`, subscription, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    console.log('Subscription successful');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to notifications:', error);
    throw error;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await axios.post(`${API_URL}/api/notifications/unsubscribe`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Unsubscribed from notifications');
    }
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from notifications:', error);
    throw error;
  }
}
