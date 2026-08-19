import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';

import {
  getSubscription,
  subscribeToPush,
  isIos,
  isInStandaloneMode,
  getServiceWorkerRegistration,
  isAndroidTwa,
} from '../../utils/notifications';

const NotificationSettings = () => {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);

  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default'
  );

  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // iOS browser - installation required
  if (isIos() && !isInStandaloneMode()) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium">
          Notifications Permission
        </h3>

        <p className="text-sm text-gray-500">
          To allow notifications, please download the app.
        </p>
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      try {
        await getServiceWorkerRegistration();

        const currentSubscription = await getSubscription();

        if (mounted) {
          setSubscription(currentSubscription);

          if (typeof Notification !== 'undefined') {
            setPermissionStatus(Notification.permission);
          }
        }
      } catch (error) {
        console.error(
          'Service Worker / Push subscription error:',
          error
        );
      }
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const askPermission = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setShowResetPrompt(false);

    try {
      if (!user?.registerId) {
        throw new Error('User information is not available');
      }

      /*
       * Important:
       *
       * In a TWA, Android's native POST_NOTIFICATIONS permission
       * and the web Notification.permission are different layers.
       *
       * android-browser-helper 2.6.2 has a known issue where
       * Notification.requestPermission() may only change the web
       * permission and not show the native Android permission dialog.
       *
       * Therefore we do NOT pretend that "granted" here means the
       * Android TWA permission is definitely granted.
       */

      const permission =
        typeof Notification !== 'undefined'
          ? await Notification.requestPermission()
          : 'denied';

      setPermissionStatus(permission);

      if (permission !== 'granted') {
        setShowResetPrompt(true);

        throw new Error(
          'Notification permission was not granted.'
        );
      }

      /*
       * At this point the web Push permission is granted.
       * Now create/reuse the PushSubscription and save it.
       */
      const sub = await subscribeToPush(user.registerId);

      setSubscription(sub);

      toast.success(
        isAndroidTwa()
          ? 'Web notifications enabled. If Android notifications are still blocked, the TWA native permission must also be granted.'
          : 'Notifications enabled successfully'
      );
    } catch (error) {
      console.error('Notification permission error:', error);

      toast.error(
        `Failed to enable notifications: ${
          error?.message || 'Unknown error'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            Notifications Permission
          </h3>

          <p className="text-sm text-gray-500">
            Click &quot;Allow&quot; to receive real-time updates.
          </p>

          {showResetPrompt && (
            <p className="mt-2 text-sm text-red-600">
              Notifications are blocked. Please enable notifications
              in Android settings if the device permission has already
              been denied.
            </p>
          )}

          {isAndroidTwa() &&
            permissionStatus === 'granted' &&
            !subscription && (
              <p className="mt-2 text-sm text-amber-600">
                Web notification permission is granted, but the Android
                app notification permission may still need to be allowed.
              </p>
            )}
        </div>

        {!subscription ? (
          <button
            type="button"
            onClick={askPermission}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 text-white rounded-md transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Bell className="mr-2 h-5 w-5" />

            {isLoading ? 'Requesting...' : 'Allow'}
          </button>
        ) : (
          <div className="flex items-center text-green-600">
            <Bell className="mr-2 h-5 w-5" />
            Allowed
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
