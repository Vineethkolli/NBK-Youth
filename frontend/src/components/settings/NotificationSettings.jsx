import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import {
  getSubscription,
  subscribeToPush,
  isIos,
  isInStandaloneMode,
  isTrustedWebActivity,
  getServiceWorkerRegistration,
} from '../../utils/notifications';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const isIosBrowser = isIos() && !isInStandaloneMode();
  const isTwa = isTrustedWebActivity();

  useEffect(() => {
    if (isIosBrowser) return;

    getServiceWorkerRegistration()
      .then(() => getSubscription().then(setSubscription))
      .catch((error) => console.error('Service Worker Error:', error));
  }, [isIosBrowser]);

  const askPermission = async () => {
    try {
      if (typeof Notification === 'undefined') {
        throw new Error('Notifications are not supported on this device');
      }

      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        setShowResetPrompt(true);
        throw new Error(isTwa ? 'Android notification permission was denied' : 'Permission denied');
      }
      setShowResetPrompt(false);

      const sub = await subscribeToPush(user?.registerId);
      setSubscription(sub);
      toast.success('Notifications enabled successfully');
    } catch (error) {
      toast.error('Failed to enable notifications: ' + error.message);
    }
  };

  if (isIosBrowser) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium">Notifications Permission</h3>
        <p className="text-sm text-gray-500">
          To allow notifications on iPhone or iPad, install the app to your home screen first.
        </p>
      </div>
    );
  }

  const permissionMessage = isTwa
    ? 'On the Play Store app, Allow will request the Android notification permission.'
    : 'Click "Allow" to receive real-time updates.';

  const resetMessage = isTwa
    ? 'Notifications are blocked at the Android app level. Open the app info page on your device and allow notifications, or reinstall the app if you already denied it.'
    : 'Notifications are blocked. Reset permissions by clearing the app data in your settings or clicking the info "i" icon near the URL bar.';

  const permissionLabel =
    permissionStatus === 'granted'
      ? 'Allowed'
      : permissionStatus === 'denied'
        ? 'Blocked'
        : 'Not requested yet';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notifications Permission</h3>
          <p className="text-sm text-gray-500">{permissionMessage}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
            Current status: {permissionLabel}
          </p>
          {showResetPrompt && (
            <p className="mt-2 text-sm text-red-600">
              {resetMessage}
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
