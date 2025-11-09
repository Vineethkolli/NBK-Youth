import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function AppUpdate() {
  const [isOpen, setIsOpen] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        toast.success("App updated successfully!");
      });

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          setRegistration(reg);
          setIsOpen(true);
        }

        reg?.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setRegistration(reg);
              setIsOpen(true);
            }
          });
        });
      });
    }
  }, []);

  const handleReload = () => {
    setIsOpen(false);
    toast.loading("Updating app...");
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 800);
  };

  const handleLater = () => {
    setIsOpen(false);
    toast("You’ll see the update next time you open the app.", { icon: "⏳" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          🚀 New Update Available
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          A new version of <strong>NBK YOUTH</strong> is available with the latest improvements:
        </p>

        <div className="mt-4 text-left text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>✨ New features and performance improvements</li>
            <li>🐞 Bug fixes and stability updates</li>
            <li>🔒 Security enhancements</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handleLater}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReload}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
