import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";

export default function UpdateDialog() {
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
    setTimeout(() => window.location.reload());
  };

  const handleLater = () => {
    setIsOpen(false);
    toast("You’ll see the update next time you open the app.", { icon: "⏳" });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleLater}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <Dialog.Title className="text-xl font-semibold text-gray-900">
          New Update Available 🚀
        </Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-gray-600">
          A new version of <strong>NBK YOUTH</strong> is available with the latest improvements:
        </Dialog.Description>

        <div className="mt-4 text-left text-sm bg-gray-50 p-3 rounded-lg border">
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>✨ New features and performance boosts</li>
            <li>🐞 Bug fixes and stability improvements</li>
            <li>🔒 Security updates</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handleLater}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReload}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Reload Now
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
