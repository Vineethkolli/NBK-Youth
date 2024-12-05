import axios from 'axios';
import { API_URL } from './config';

export const showNotification = (title, body, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    });

    notification.onclick = () => {
      if (options.url) {
        window.focus();
        window.location.href = options.url;
      }
    };
  }
};

export async function subscribeToPushNotifications() {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return true; // Already subscribed
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });

    // Send subscription to server
    await axios.post(`${API_URL}/api/notifications/subscribe`, subscription);
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await axios.post(`${API_URL}/api/notifications/unsubscribe`);
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

export async function checkNotificationStatus() {
  try {
    const { data } = await axios.get(`${API_URL}/api/notifications/status`);
    return data.enabled;
  } catch (error) {
    console.error('Failed to check notification status:', error);
    return false;
  }
}