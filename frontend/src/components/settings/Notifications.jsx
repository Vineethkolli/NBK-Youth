import { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../../utils/notifications';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function Notifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);

  useEffect(() => {
    checkNotificationSupport();
    checkNotificationStatus();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setNotificationsSupported(supported);
  };

  const checkNotificationStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications/status`);
      setNotificationsEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check notification status:', error);
    }
  };

  const toggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await unsubscribeFromPushNotifications();
        setNotificationsEnabled(false);
        toast.success('Notifications disabled');
      } else {
        const success = await subscribeToPushNotifications();
        if (success) {
          setNotificationsEnabled(true);
          toast.success('Notifications enabled');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update notification settings');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center">
        <Bell className="mr-2" /> Notifications
      </h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        {!notificationsSupported ? (
          <div className="flex items-center text-yellow-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>Notifications are not supported in this browser</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`px-4 py-2 rounded-md text-white ${
                notificationsEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;