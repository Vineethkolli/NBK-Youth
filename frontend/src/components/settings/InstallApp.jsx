import { useState, useEffect } from "react";
import { Plus, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";

function AddToHomeScreen() {
  const [platform, setPlatform] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Detect platform
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      setPlatform("ios");
    } else if (/Android/.test(navigator.userAgent)) {
      setPlatform("android");
    } else if (/Windows/.test(navigator.userAgent)) {
      setPlatform("windows");
    }

    // Store install prompt globally
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleAddToHomeScreen = async () => {
    if (platform === "ios") {
      toast("Tap Share → 'Add to Home Screen' in Safari.");
      return;
    }

    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      const { outcome } = await window.deferredInstallPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("App added to Home Screen!");
        window.deferredInstallPrompt = null; // Reset after installation
        setIsInstallable(false);
      }
    } else {
      toast.error("Your browser does not support this feature.");
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Add to Home Screen</p>
          <p className="text-sm text-gray-500">Quick access with one tap</p>
        </div>
        <button
          onClick={handleAddToHomeScreen}
          className={`px-4 py-2 ${isInstallable ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400"} text-white rounded-md flex items-center`}
          disabled={!isInstallable}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Home Screen
        </button>
      </div>
    </div>
  );
}

export default AddToHomeScreen;
