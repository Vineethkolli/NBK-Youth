import { useState, useEffect } from 'react';
import { Bell, Download, AlertTriangle } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/notifications';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
    checkNotificationStatus();
    checkInstallability();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setNotificationsSupported(supported);
  };

  const checkInstallability = () => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }
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

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        toast.success('App installed successfully');
      }
    } catch (error) {
      toast.error('Installation failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

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

        {/* Install App Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Install App
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            {window.matchMedia('(display-mode: standalone)').matches ? (
              <p className="text-gray-500">App is already installed</p>
            ) : isIOS ? (
              <div className="space-y-2">
                <p className="font-medium">Install on iOS:</p>
                <ol className="list-decimal list-inside text-gray-600">
                  <li>Tap the share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install</li>
                </ol>
              </div>
            ) : isInstallable ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Install as desktop app</p>
                  <p className="text-sm text-gray-500">
                    Get quick access and offline support
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Install Now
                </button>
              </div>
            ) : (
              <p className="text-gray-500">
                Installation is not available on this device/browser
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;