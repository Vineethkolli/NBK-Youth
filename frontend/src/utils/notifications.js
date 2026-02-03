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

// Detect iOS devices
export const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Detect Android devices
export const isAndroid = () => /android/i.test(window.navigator.userAgent);

// Check if PWA is in standalone mode
export const isInStandaloneMode = () =>
  ('standalone' in window.navigator) && window.navigator.standalone;

// Check display-mode: standalone (Android/desktop)
export const isStandaloneDisplayMode = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// Detect Trusted Web Activity (TWA) shell
export const isTwa = () => {
  try {
    return typeof document !== 'undefined' && document.referrer?.startsWith('android-app://');
  } catch (e) {
    return false;
  }
};

// Installed app (standalone PWA or TWA)
export const isInstalledApp = () => isStandaloneDisplayMode() || isTwa();

// Open Android notification settings (app-specific if package is provided)
export const openAndroidNotificationSettings = (packageName) => {
  if (!isAndroid()) return;

  const base = 'intent://settings#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;';
  const pkg = packageName
    ? `S.android.provider.extra.APP_PACKAGE=${packageName};`
    : '';
  const intentUrl = `${base}${pkg}end`;

  window.location.href = intentUrl;
};
