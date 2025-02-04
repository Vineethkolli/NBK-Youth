import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    // Detect platform
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setPlatform('ios');
    } else if (/Android/.test(navigator.userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if app is installed
    const isAppInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (!isAppInstalled) {
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);

        const timer = setTimeout(() => {
          setShowInstallPrompt(false);
        }, 1000000);

        return () => clearTimeout(timer);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      } else {
        toast.error('Installation rejected');
      }
    } else if (platform === 'ios') {
      toast.info('Use "Add to Home Screen" from the share menu');
    } else {
      toast.error('Installation not available');
    }
  };

  if (!showInstallPrompt) {
    return null;
  }

return (
  <div className="fixed top-4 left-4 right-4 bg-green-50 bg-opacity-80 text-green-800 p-4 flex items-center justify-between shadow-lg rounded-lg z-50">
    <div>
      <h3 className="text-lg font-medium">Install Our App</h3>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={handleInstallClick}
        className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-700 flex items-center transition-colors duration-200"
      >
        <Download className="h-4 w-4 mr-2" />
        Install Now
      </button>
      <button onClick={() => setShowInstallPrompt(false)}>
        <X className="h-6 w-6" />
      </button>
    </div>
  </div>
);

}

export default InstallApp;
