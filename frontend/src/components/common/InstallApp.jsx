import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function InstallApp() {
  const [platform, setPlatform] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSPopup, setShowIOSPopup] = useState(false);
  const promptRef = useRef(null);

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

    let timer;
    const alreadyShown = sessionStorage.getItem('installPromptShown');
    if (!isInstalled && !alreadyShown) {
      setShowInstallPrompt(true);
      sessionStorage.setItem('installPromptShown', 'true');
      timer = setTimeout(() => {
        setShowInstallPrompt(false);
      }, 4000);
    }

    const onAppInstalled = () => {
      setIsInstalled(true);
      deferredPrompt = null;
      toast.success('App installed successfully!');
    };
    window.addEventListener('appinstalled', onAppInstalled);

    // Global click listener to close the ribbon when clicking outside the prompt
    const handleClickOutside = (event) => {
      if (promptRef.current && !promptRef.current.contains(event.target)) {
        setShowInstallPrompt(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
      if (timer) clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isInstalled]);

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
        setShowInstallPrompt(false);
      } else {
        toast.error('Installation rejected');
      }
    } catch (error) {
      toast.error('Installation failed');
    }
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <>
      <div
        ref={promptRef}
        className="fixed top-4 left-4 right-4 bg-green-50 bg-opacity-80 text-green-800 p-4 flex items-center justify-between shadow-lg rounded-lg z-50"
        // Clicks inside the container don’t trigger the document listener
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-medium">Download App</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-700 flex items-center transition-colors duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Now
          </button>
          <button onClick={() => setShowInstallPrompt(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {showIOSPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setShowIOSPopup(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4"
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
