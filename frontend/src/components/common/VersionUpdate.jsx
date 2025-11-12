import { useEffect, useRef } from "react";
import { RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function VersionUpdate({ isOpen, onReload, onLater }) {
  const dialogRef = useRef(null);

  // Show toast after reload if flag exists
  useEffect(() => {
    if (localStorage.getItem("showReloadToast")) {
      toast.success("🚀 App updated successfully");
      localStorage.removeItem("showReloadToast");
    }

    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLater = () => {
    toast("🕒 Update ready on next open");
    onLater();
  };

  const handleReload = () => {
    localStorage.setItem("showReloadToast", "true");
    onReload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-dialog-title"
      >
        <div className="flex justify-center mb-4">
          <img
            src="/logo/512.png"
            alt="App Logo"
            className="w-16 h-16 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
          />
        </div>

        <h2
          id="version-dialog-title"
          className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2"
        >
          New Version Available
        </h2>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          A new version of the app is ready. Reload now to get the latest updates and improvements.
        </p>

        {/* What's New Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            What&apos;s New
          </h3>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1">
            <li>⚡ Improved performance and loading speed</li>
            <li>🐞 Bug fixes and stability improvements</li>
            <li>🔒 Improved privacy and stronger security</li>
            <li>✨ UI and UX enhancements for better usability</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLater}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleReload}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
}
