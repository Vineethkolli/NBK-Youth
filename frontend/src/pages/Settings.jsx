import { useState, useEffect } from 'react';
import { Bell, Download, AlertTriangle, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';

function Settings() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isAppInstallable, setIsAppInstallable] = useState(false);
  const [userPlatform, setUserPlatform] = useState(null);

  useEffect(() => {
    detectInstallability();
  }, []);

  // Check if the app can be installed
  const detectInstallability = () => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      setUserPlatform('ios');
    } else if (/Android/.test(navigator.userAgent)) {
      setUserPlatform('android');
    } else if (/Windows/.test(navigator.userAgent)) {
      setUserPlatform('windows');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsAppInstallable(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstallable(false);
    }
  };

  // Trigger app installation
  const handleInstallApp = async () => {
    if (!installPromptEvent) return;

    try {
      const result = await installPromptEvent.prompt();
      if (result.outcome === 'accepted') {
        setInstallPromptEvent(null);
        setIsAppInstallable(false);
        toast.success('App installed successfully');
      }
    } catch (error) {
      toast.error('Installation failed');
    }
  };

  // Render platform-specific installation instructions
  const renderInstallInstructions = () => {
    switch (userPlatform) {
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

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
                {isAppInstallable && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Install as desktop app</p>
                      <p className="text-sm text-gray-500">
                        Get quick access and offline support
                      </p>
                    </div>
                    <button
                      onClick={handleInstallApp}
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
      </div>
    </div>
  );
}

export default Settings;