// frontend/src/components/InstallApp.jsx
import { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect platform for showing instructions (iOS doesn’t support beforeinstallprompt)
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if app is already installed
    const checkInstalled = () => {
      // For most browsers (standalone mode)
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    // Listen for the beforeinstallprompt event to capture the install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event to update UI immediately
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    // If no deferred prompt, then installation isn’t available
    if (!deferredPrompt) {
      if (platform === 'ios') {
        toast.info('On iOS, please use Safari’s "Add to Home Screen" option to install.');
      } else {
        toast.error('Installation is not available at this time.');
      }
      return;
    }

    try {
      // Show the installation prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Installation accepted!');
      } else {
        toast.info('Installation dismissed');
      }
      // Clear the deferred prompt once used
      setDeferredPrompt(null);
    } catch (error) {
      toast.error('Installation failed');
      console.error('Installation error:', error);
    }
  };

  // If app is installed, you can either hide or disable the button
  if (isInstalled) {
    return (
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-green-700">App is already installed!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Install App</h3>
          <p className="text-sm text-gray-500">Get quick access and improved performance.</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Install Now
        </button>
      </div>

      {platform === 'ios' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            iOS Installation Steps:
          </h4>
          <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600">
            <li>Open this website in Safari.</li>
            <li>Tap the Share button at the bottom.</li>
            <li>Select "Add to Home Screen".</li>
            <li>Tap "Add" to install the app.</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default InstallApp;
