import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function InstallApp() {
  const [platform, setPlatform] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPopup, setShowIOSPopup] = useState(false);

  useEffect(() => {
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
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      ) {
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
    if (platform === 'ios') {
      setShowIOSPopup(true);
      return;
    }

    if (!deferredPrompt) {
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
    <>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Download App</h3>
            <p className="text-sm text-gray-500">
              Click &quot;Install Now&quot; to get better performance.
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center transition"
          >
            <Download className="h-5 w-5 mr-2" />
            Install Now
          </button>
        </div>
      </div>

      {showIOSPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setShowIOSPopup(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-900">
              Install App
            </h3>
            <ol className="mt-2 ml-6 list-decimal text-sm text-gray-700 space-y-2">
              <li>Open this website in Safari / Chrome</li>
              <li>Tap the <b>Share</b> button</li>
              <li>Scroll down and select <b>Add to Home Screen</b></li>
              <li>Tap <b>Add</b> to install</li>
            </ol>
            <button
              onClick={() => setShowIOSPopup(false)}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallApp;
