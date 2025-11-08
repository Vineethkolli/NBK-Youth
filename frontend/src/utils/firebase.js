import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let appInstance;
let authInstance;

const buildConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const getFirebaseAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  const firebaseConfig = buildConfig();
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
  }

  appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  authInstance.useDeviceLanguage();

  return authInstance;
};
