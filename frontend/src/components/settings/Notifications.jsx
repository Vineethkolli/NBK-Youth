import { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { subscribeToPushNotifications } from '../../utils/notifications';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function Notifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('default');

  useEffect(() => {
    checkNotificationSupport();
    handlePermissionStatus();

    // Listen for changes in permission state if the Permissions API is available.
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        setPermissionStatus(status.state);
        status.onchange = () => {
          setPermissionStatus(status.state);
        };
      });
    } else {
      // Fallback if Permissions API isn't supported.
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setNotificationsSupported(supported);
  };

  const handlePermissionStatus = () => {
    const permission = Notification.permission;
    setPermissionStatus(permission);
    if (permission === 'granted') {
      setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission only when notifications are not enabled.
      if (Notification.permission === 'denied') {
        // If permission was already denied, instruct the user to change it manually.
        toast.error('Please enable notifications from your browser settings.');
        return;
      }
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        // Call your subscription logic here.
        const success = await subscribeToPushNotifications();
        if (success) {
          setNotificationsEnabled(true);
          toast.success('Notifications enabled');
        }
      } else {
        toast.error('Notification permission was not granted');
      }
    } else {
      // When notifications are already enabled, instruct the user to disable via browser settings.
      toast.error('Disable notifications from your browser settings.');
    }
  };

  // Map the permission status to a friendly text.
  const displayPermission = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Allowed';
      case 'denied':
        return 'Denied';
      default:
        return 'Not Yet Granted';
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
              <p className="font-medium">
                Permission: <span className="ml-1 text-sm text-gray-500">{displayPermission()}</span>
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
              {notificationsEnabled ? 'Block' : 'Allow'} Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
