import { useState, useEffect } from 'react';
import { Bell, Download, AlertTriangle, Share2, Home, Lightbulb, Rocket } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../utils/notifications';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [translate, setTranslate] = useState(false);
  
  useEffect(() => {
    if (translate) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
  
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "te",
            autoDisplay: false, // Prevents showing the language selection menu
          },
          "google_translate_element"
        );
        const observer = new MutationObserver(() => {
          const selectLang = document.querySelector(".goog-te-combo");
          if (selectLang) {
            selectLang.value = "te"; // Select Telugu
            selectLang.dispatchEvent(new Event("change")); // Trigger translation
            observer.disconnect(); // Stop observing once translation is triggered
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      };
    }
  }, [translate]);

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
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      setPlatform('ios');
    } else if (/Android/.test(navigator.userAgent)) {
      setPlatform('android');
    } else if (/Windows/.test(navigator.userAgent)) {
      setPlatform('windows');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    });

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

  const renderInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-2">
            <p className="font-medium">Install on iOS:</p>
            <ol className="list-decimal list-inside text-gray-600">
              <li>Tap the <Share2 className="inline h-4 w-4" /> Share button in Safari</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to install</li>
            </ol>
          </div>
        );
      case 'android':
        return (
          <div className="space-y-2">
            <p className="font-medium">Install on Android:</p>
            <ol className="list-decimal list-inside text-gray-600">
              <li>Tap the menu icon (three dots) in Chrome</li>
              <li>Tap "Add to Home screen"</li>
              <li>Tap "Add" to install</li>
            </ol>
          </div>
        );
      case 'windows':
        return (
          <div className="space-y-2">
            <p className="font-medium">Install on Windows:</p>
            <ol className="list-decimal list-inside text-gray-600">
              <li>Click the install icon in the address bar</li>
              <li>Or click the menu (three dots) and select "Install app"</li>
              <li>Click "Install" in the prompt</li>
            </ol>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-1xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

        {/* Translate Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">Translate Website</h3>
          <button 
            onClick={() => setTranslate(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Translate to Telugu
          </button>
          <div id="google_translate_element"></div>
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

        {/* Install App Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Install App
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {window.matchMedia('(display-mode: standalone)').matches ? (
              <p className="text-gray-500">App is already installed</p>
            ) : (
              <div className="space-y-4">
                {isInstallable && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Install as desktop app</p>
                      <p className="text-sm text-gray-500">
                        Get quick access and offline support
                      </p>
                    </div>
                    <button
                      onClick={handleInstall}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install Now
                    </button>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="font-medium mb-4">Installation Instructions:</p>
                  {renderInstallInstructions()}
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Future Enhancements Timeline Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
          <Rocket className="h-6 w-6 text-black-500 mr-2" />
            Future Enhancements
          </h3>
          <div className="pl-4 space-y-4">
            <div className="flex items-start">
              <div className="bg-indigo-500 h-4 w-4 rounded-full mt-0.5 mr-4"></div>
              <div>
                <p className="font-medium">Notification Trigger</p>
                <p className="text-sm text-gray-500">Enhance notifications as a device notifications.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-500 h-4 w-4 rounded-full mt-0.5 mr-4"></div>
              <div>
                <p className="font-medium"> Memory Cache</p>
                <p className="text-sm text-gray-500">Implement memory caching for faster and offline performance.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-500 h-4 w-4 rounded-full mt-0.5 mr-4"></div>
              <div>
                <p className="font-medium">Vibe</p>
                <p className="text-sm text-gray-500">Make media player work effectively in background.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-500 h-4 w-4 rounded-full mt-0.5 mr-4"></div>
              <div>
                <p className="font-medium">App Download</p>
                <p className="text-sm text-gray-500">Improve app download and installation process.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-500 h-4 w-4 rounded-full mt-0.5 mr-4"></div>
              <div>
                <p className="font-medium">Enhance UI</p>
                <p className="text-sm text-gray-500">Progress of uploading and Update all interface components.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;