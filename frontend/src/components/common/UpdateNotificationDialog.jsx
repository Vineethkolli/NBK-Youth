import { useState, useEffect } from 'react';
import { X, RefreshCw, Sparkles, Bug, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import APP_VERSION from '../../config/version';

const UpdateNotificationDialog = ({ onClose, onReload }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleReload = () => {
    toast.success('Updating application...', {
      duration: 2000,
      icon: '🔄',
    });
    setTimeout(() => {
      onReload();
    }, 500);
  };

  const handleCancel = () => {
    setIsClosing(true);
    toast('Update postponed. Changes will apply on next visit.', {
      duration: 3000,
      icon: '⏰',
    });
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Prevent body scroll when dialog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">New Update Available!</h2>
              <p className="text-blue-100 mt-1">
                Version {APP_VERSION.version} • {APP_VERSION.releaseDate}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* What's New Section */}
          {APP_VERSION.changes.whatsNew.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What's New
                </h3>
              </div>
              <ul className="space-y-2 ml-2">
                {APP_VERSION.changes.whatsNew.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bug Fixes Section */}
          {APP_VERSION.changes.bugFixes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Bug className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bug Fixes
                </h3>
              </div>
              <ul className="space-y-2 ml-2">
                {APP_VERSION.changes.bugFixes.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Updates Section */}
          {APP_VERSION.changes.securityUpdates.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Security Updates
                </h3>
              </div>
              <ul className="space-y-2 ml-2">
                {APP_VERSION.changes.securityUpdates.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Clicking "Reload Now" will refresh the application
              to apply the latest updates. Your session will be preserved.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Later
            </button>
            <button
              onClick={handleReload}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 justify-center"
            >
              <RefreshCw className="h-5 w-5" />
              Reload Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationDialog;
