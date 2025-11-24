import api from '../utils/api';
import { urlBase64ToUint8Array } from './vapidKeys';

// Get the service worker registration
export const getServiceWorkerRegistration = async () => {
  if ('serviceWorker' in navigator) {
    return await navigator.serviceWorker.ready;
  }
  throw new Error('Service Worker not supported');
};

// Get current push subscription
export const getSubscription = async () => {
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
};

// Subscribe user to push
export const subscribeToPush = async (registerId) => {
  const registration = await navigator.serviceWorker.ready;

  const response = await api.get(`/api/notifications/publicKey`);
  const publicVapidKey = response.data.publicKey;
  const converted = urlBase64ToUint8Array(publicVapidKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: converted,
  });

  await api.post(`/api/notifications/subscribe`, {
    registerId,
    subscription,
  });

  return subscription;
};

// Detect iOS devices
export const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Check if PWA is in standalone mode 
export const isInStandaloneMode = () =>
  ('standalone' in window.navigator) && window.navigator.standalone;
