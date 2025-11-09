import { useEffect, useState } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

// App version info
export const APP_VERSION = {
  version: '1.0.0',
  releaseDate: '2025-01-09',
  whatsNew: [
    'Improved performance and faster loading',
    'New clean dashboard layout',
    'Enhanced notifications and alert system',
    'Better mobile experience and animations',
  ],
};

const UpdateNotificationDialog = ({ onReload, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleReload = () => {
    toast.success('Updating to latest version...');
    setTimeout(() => onReload(), 500);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Update Available!</h2>
              <p className="text-blue-100 text-sm">
                Version {APP_VERSION.version} • {APP_VERSION.releaseDate}
              </p>
            </div>
          </div>
        </div>

        {/* What's New */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What's New</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            {APP_VERSION.whatsNew.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-5 text-sm text-blue-800 dark:text-blue-300">
            Reload now to get the latest improvements instantly.
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleReload}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationDialog;
