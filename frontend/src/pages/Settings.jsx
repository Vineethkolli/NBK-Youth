// Settings.jsx
import { useState, useEffect } from 'react';
import { Download, AlertTriangle, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Settings() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [platform, setPlatform] = useState(getPlatform());
  const [isInstalled, setIsInstalled] = useState(false);

  // Improved platform detection
  function getPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    if (/Win/.test(userAgent)) return 'windows';
    if (/Mac/.test(userAgent)) return 'macos';
    return 'other';
  }

  useEffect(() => {
    // Check if already installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    try {
      const result = await installPrompt.prompt();
      if (result.outcome === 'accepted') {
        toast.success('App installed successfully!');
      }
      setInstallPrompt(null);
    } catch (error) {
      toast.error('Installation failed');
    }
  };

  const renderInstallContent = () => {
    if (isInstalled) return <p className="text-gray-500">App is already installed</p>;

    return (
      <div className="space-y-4">
        {/* Show install button for supporting browsers */}
        {installPrompt && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Install as native app</p>
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

        {/* Always show platform instructions */}
        <div className="border-t pt-4">
          <p className="font-medium mb-4">Installation Guide:</p>
          {platform === 'ios' ? (
            <div className="space-y-2">
              <ol className="list-decimal list-inside text-gray-600">
                <li>Tap <Share2 className="inline h-4 w-4" /> in Safari</li>
                <li>Select "Add to Home Screen"</li>
                <li>Confirm installation</li>
              </ol>
            </div>
          ) : platform === 'android' ? (
            <div className="space-y-2">
              <ol className="list-decimal list-inside text-gray-600">
                <li>Open Chrome menu (⋮)</li>
                <li>Tap "Install App"</li>
                <li>Confirm installation</li>
              </ol>
            </div>
          ) : platform === 'windows' || platform === 'macos' ? (
            <div className="space-y-2">
              <p className="text-gray-600">
                Click the "Install Now" button above or look for the install icon
                in your browser's address bar
              </p>
            </div>
          ) : (
            <div className="text-yellow-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Automatic installation not supported in this browser</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-1xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">App Installation</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Native App Setup
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {renderInstallContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;