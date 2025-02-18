import { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function InstallApp() {
  const [platform, setPlatform] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect platform
    const detectPlatform = () => {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setPlatform('ios');
      } else if (/Android/.test(navigator.userAgent)) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    };

    detectPlatform();

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      deferredPrompt = null;
      toast.success('App installed successfully!');
    });

    return () => {
      window.removeEventListener('appinstalled', () => {
        setIsInstalled(true);
        deferredPrompt = null;
        toast.success('App installed successfully!');
      });
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (platform === 'ios') {
        toast.info('Please use Safari\'s "Add to Home Screen" option to install');
        return;
      }
      toast.error('Installation not available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        toast.success('Installation accepted');
      } else {
        toast.error('Installation rejected');
      }
    } catch (error) {
      toast.error('Installation failed');
    }
  };

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
          <h3 className="text-lg font-medium">Download App</h3>
          <p className="text-sm text-gray-500">Click "Download Now" to get better performance.</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Now
        </button>
      </div>

      {platform === 'ios' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            iOS Installation Steps:
          </h4>
          <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600">
            <li>Open this website in Safari/Chrome</li>
            <li>Tap the Share button</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to install</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default InstallApp;
 