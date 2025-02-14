import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { urlBase64ToUint8Array } from '../utils/vapidKeys';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import NotificationForm from '../components/notifications/NotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';

function Notifications() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  useEffect(() => {
    // Register the service worker if available.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registerServiceWorker)
        .catch((error) => console.error('Service Worker Error:', error));
    }
    getSubscription();

    // Optional: update permissionStatus if user changes settings externally.
    const handleVisibilityChange = () => {
      setPermissionStatus(Notification.permission);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const registerServiceWorker = async (registration) => {
    console.log('Service Worker registered:', registration);
  };

  const askPermission = async () => {
    try {
      const permissionResult = await Notification.requestPermission();
      setPermissionStatus(permissionResult);
      if (permissionResult !== 'granted') {
        setShowResetPrompt(true);
        throw new Error('Permission denied');
      }
      // If permission granted, hide any reset prompt.
      setShowResetPrompt(false);
      await subscribeUser();
    } catch (error) {
      console.error('Permission error:', error);
      toast.error('Failed to enable notifications: ' + error.message);
    }
  };

  const subscribeUser = async () => {
    try {
      if (!user?.registerId) {
        toast.error('User is not logged in or registerId is missing');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const response = await axios.get(`${API_URL}/api/notifications/publicKey`);
      const publicVapidKey = response.data.publicKey;
      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await axios.post(`${API_URL}/api/notifications/subscribe`, {
        registerId: user.registerId,
        subscription,
      });

      setSubscription(subscription);
      toast.success('Notifications enabled successfully');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe for notifications');
    }
  };

  const getSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    setSubscription(existingSubscription);
  };

  return (
    <div className="max-w-1xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Bell className="mr-2" /> Notifications Permission
            </h2>
            <p className="text-sm text-gray-500">
              Click "Allow Notifications" to receive real-time updates.
            </p>
            {showResetPrompt && (
              <p className="mt-2 text-sm text-red-600">
                Notifications are blocked. Please reset permissions by clearing the app data in your settings or clicking the info "i" icon near the URL bar.
              </p>
            )}
          </div>
          {!subscription ? (
            <button
              onClick={askPermission}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Bell className="mr-2 h-5 w-5" /> Allow Notifications
            </button>
          ) : (
            <div className="flex items-center text-green-600">
              <Bell className="mr-2 h-5 w-5" /> Notifications Allowed
            </div>
          )}
        </div>
      </div>
      <NotificationForm />
      <NotificationHistory />
    </div>
  );
}

export default Notifications;
