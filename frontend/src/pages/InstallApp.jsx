import { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';

function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Install Application
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Install our app for a better experience on your device
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {window.matchMedia('(display-mode: standalone)').matches ? (
            <div className="text-center text-gray-500">
              App is already installed on your device
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To install on iOS:
              </p>
              <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2">
                <li>Tap the <Share2 className="inline h-4 w-4" /> Share button in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install the app</li>
              </ol>
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Note: Installation is only available in Safari browser on iOS
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Install our app to get:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>Faster loading times</li>
                <li>Offline access</li>
                <li>Native app-like experience</li>
                <li>Home screen icon</li>
              </ul>
              <button
                onClick={handleInstall}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="mr-2 h-5 w-5" />
                Install App
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Installation is not available on this device/browser. Make sure you're using a supported browser (Chrome, Edge, or other Chromium-based browsers) and accessing the site over HTTPS.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstallApp;