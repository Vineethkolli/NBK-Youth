import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { urlBase64ToUint8Array } from '../utils/vapidKeys';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import NotificationForm from '../components/notifications/NotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';

// Helper function to detect iOS devices.
const isIos = () => {
  if (typeof window !== 'undefined' && window.navigator) {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }
  return false;
};

// Check if the app is running in standalone mode (PWA)
const isInStandaloneMode = () => {
  if (typeof window !== 'undefined' && window.navigator) {
    return ('standalone' in window.navigator) && window.navigator.standalone;
  }
  return false;
};

function Notifications() {
  // Determine if the device is iOS and not running as a PWA.
  const iosNonPWA = isIos() && !isInStandaloneMode();

  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registerServiceWorker)
          .catch((error) => console.error('Service Worker Error:', error));
      }
      getSubscription();
    } catch (err) {
      console.error('Initialization Error:', err);
      setError(err.message);
    }

    const handleVisibilityChange = () => {
      if (typeof Notification !== 'undefined') {
        setPermissionStatus(Notification.permission);
      }
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
      if (typeof Notification === 'undefined') {
        throw new Error('Notifications are not supported in this browser');
      }
      const permissionResult = await Notification.requestPermission();
      setPermissionStatus(permissionResult);
      if (permissionResult !== 'granted') {
        setShowResetPrompt(true);
        throw new Error('Permission denied');
      }
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

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await axios.post(`${API_URL}/api/notifications/subscribe`, {
        registerId: user.registerId,
        subscription: newSubscription,
      });

      setSubscription(newSubscription);
      toast.success('Notifications enabled successfully');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe for notifications');
    }
  };

  const getSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error getting subscription:', error);
    }
  };

  // Conditionally render the notifications permission section.
  const notificationPermissionSection = iosNonPWA ? (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold flex items-center mb-2">
            <Bell className="mr-2" /> Notifications Permission
          </h2>
          <p className="text-sm text-gray-500">
            To allow notifications, please download the app.
          </p>
        </div>
      </div>
    </div>
  ) : (
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
  );

  return (
    <div className="max-w-1xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {notificationPermissionSection}
      <NotificationForm />
      <NotificationHistory />
    </div>
  );
}

export default Notifications;
