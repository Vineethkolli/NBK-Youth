import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';
import { urlBase64ToUint8Array } from './vapidKeys';

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Worker not supported');
  }
};

export const getSubscription = async () => {
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
};

export const subscribeToPush = async (registerId) => {
  const registration = await navigator.serviceWorker.ready;
  const response = await axios.get(`${API_URL}/api/notifications/publicKey`);
  const publicVapidKey = response.data.publicKey;
  const converted = urlBase64ToUint8Array(publicVapidKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: converted,
  });

  await axios.post(`${API_URL}/api/notifications/subscribe`, {
    registerId,
    subscription,
  });

  return subscription;
};

export const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

export const isInStandaloneMode = () => (
  'standalone' in window.navigator && window.navigator.standalone
);