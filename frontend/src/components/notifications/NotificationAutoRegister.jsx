import { useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { urlBase64ToUint8Array } from '../../utils/vapidKeys';
import { useAuth } from '../../context/AuthContext';

function NotificationAutoRegister() {
  const { user } = useAuth();

  useEffect(() => {
    const registerAndSubscribe = async () => {
      if (
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted' ||
        !user?.registerId
      ) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (!existingSubscription) {
          const response = await axios.get(`${API_URL}/api/notifications/publicKey`);
          const publicVapidKey = response.data.publicKey;
          const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });

          await axios.post(`${API_URL}/api/notifications/subscribe`, {
            registerId: user.registerId,
            subscription: newSubscription,
          });
        }
      } catch (err) {
        console.error('Auto-subscription failed:', err);
      }
    };

    if ('serviceWorker' in navigator) {
      registerAndSubscribe();
    }
  }, [user]);

  return null; 
}

export default NotificationAutoRegister;
