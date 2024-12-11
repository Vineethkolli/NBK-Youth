import axios from 'axios';
import { API_URL } from './config';

export async function subscribeToPushNotifications() {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Register service worker if not already registered
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    // Get VAPID public key from server
    const response = await fetch(`${API_URL}/api/notifications/vapidPublicKey`);
    const { publicKey } = await response.json();

    const registration = await navigator.serviceWorker.ready;
    
    // Unsubscribe from any existing subscriptions
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    });

    // Send subscription to server
    await axios.post(`${API_URL}/api/notifications/subscribe`, subscription, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

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
    }

    await axios.post(`${API_URL}/api/notifications/unsubscribe`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

export function showNotification(title, body, data = {}) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    const options = {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: 'Close',
        }
      ]
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  }
}