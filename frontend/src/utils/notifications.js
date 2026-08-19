import axios from 'axios';
import { API_URL } from './config';
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
  if (!registerId) {
    throw new Error('User registration ID is missing');
  }

  const registration = await navigator.serviceWorker.ready;

  const response = await axios.get(
    `${API_URL}/api/notifications/publicKey`
  );

  const publicVapidKey = response.data.publicKey;

  if (!publicVapidKey) {
    throw new Error('VAPID public key not received');
  }

  const converted = urlBase64ToUint8Array(publicVapidKey);

  // Reuse an existing subscription when possible.
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: converted,
    });
  }

  await axios.post(`${API_URL}/api/notifications/subscribe`, {
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

// Check if PWA is in iOS standalone mode
export const isInStandaloneMode = () =>
  ('standalone' in window.navigator) &&
  window.navigator.standalone;

// Detect Android TWA
export const isAndroidTwa = () => {
  const userAgent = window.navigator.userAgent || '';

  return (
    /android/i.test(userAgent) &&
    document.referrer.startsWith('android-app://')
  );
};