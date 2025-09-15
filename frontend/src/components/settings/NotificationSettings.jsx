import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import {
  getSubscription,
  subscribeToPush,
  isIos,
  isInStandaloneMode,
  registerServiceWorker
} from '../../utils/notifications';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  if (isIos() && !isInStandaloneMode()) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium">Notifications Permission</h3>
        <p className="text-sm text-gray-500">
          To allow notifications, please download the app.
        </p>
      </div>
    );
  }

  useEffect(() => {
    registerServiceWorker()
      .then(() => getSubscription().then(setSubscription))
      .catch((error) => console.error('Service Worker Error:', error));
  }, []);

  const askPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        setShowResetPrompt(true);
        throw new Error('Permission denied');
      }
      setShowResetPrompt(false);

      const sub = await subscribeToPush(user?.registerId);
      setSubscription(sub);
      toast.success('Notifications enabled successfully');
    } catch (error) {
      toast.error('Failed to enable notifications: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notifications Permission</h3>
          <p className="text-sm text-gray-500">
            Click "Allow" to receive real-time updates.
          </p>
          {showResetPrompt && (
            <p className="mt-2 text-sm text-red-600">
              Notifications are blocked. Reset permissions by clearing the app data in your settings or clicking the info "i" icon near the URL bar.
            </p>
          )}
        </div>
        {!subscription ? (
          <button
            onClick={askPermission}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Bell className="mr-2 h-5 w-5" /> Allow
          </button>
        ) : (
          <div className="flex items-center text-green-600">
            <Bell className="mr-2 h-5 w-5" /> Allowed
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
