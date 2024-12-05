import { useState, useEffect } from 'react';
import { Bell, Download, AlertTriangle } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, checkNotificationStatus } from '../utils/notifications';
import { toast } from 'react-hot-toast';

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
    loadNotificationStatus();
    checkInstallability();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    const detectStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        setIsInstallable(false);
      }
    };

    window.addEventListener('appinstalled', detectStandalone);
    detectStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', detectStandalone);
    };
  }, []);

  const checkInstallability = () => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
  };

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setNotificationsSupported(supported);
  };

  const loadNotificationStatus = async () => {
    try {
      const status = await checkNotificationStatus();
      setNotificationsEnabled(status);
    } catch (error) {
      console.error('Failed to load notification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await unsubscribeFromPushNotifications();
        setNotificationsEnabled(false);
        toast.success('Notifications disabled');
      } else {
        await subscribeToPushNotifications();
        setNotificationsEnabled(true);
        toast.success('Notifications enabled');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update notification settings');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        toast.success('App installed successfully!');
      }
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Failed to install app');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

        {/* App Installation Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> App Installation
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            {window.matchMedia('(display-mode: standalone)').matches ? (
              <div className="flex items-center text-green-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>App is already installed</p>
              </div>
            ) : isIOS ? (
              <div className="space-y-2">
                <p className="font-medium">Install on iOS:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Tap the share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install the app</li>
                </ol>
              </div>
            ) : isInstallable ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Install NBK Youth App</p>
                  <p className="text-sm text-gray-500">Get the best experience with our installable app</p>
                </div>
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4 mr-2 inline-block" />
                  Install Now
                </button>
              </div>
            ) : (
              <p className="text-gray-600">
                App installation is not available on this device/browser
              </p>
            )}
          </div>
        </div>

        {/* Notifications Section */}
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
      </div>
    </div>
  );
}

export default Settings;