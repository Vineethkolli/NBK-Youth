import { useEffect, useState } from 'react';

function UpdateDialog() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowDialog(true);
              }
            };
          }
        };
      });
    }
  }, []);

  const handleReload = () => {
    localStorage.setItem('appJustUpdated', 'true');
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    waitingWorker?.addEventListener('statechange', (e) => {
      if (e.target.state === 'activated') window.location.reload();
    });
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md text-gray-800 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-3 text-center text-blue-600">
          🔄 New Update Available
        </h2>

        <div className="border rounded-lg bg-gray-50 p-3 mb-4 text-sm text-gray-600 max-h-48 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-2">What’s New:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>✨ Improved app performance and reliability.</li>
            <li>🐞 Bug fixes and minor UI adjustments.</li>
            <li>🔒 Security enhancements.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Later
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

export default UpdateDialog;
