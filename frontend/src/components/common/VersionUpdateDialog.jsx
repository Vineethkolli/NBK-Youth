import { useEffect, useRef } from 'react';

export default function VersionUpdateDialog({ isOpen, onReload, onLater }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full transform transition-all animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-dialog-title"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 
          id="version-dialog-title" 
          className="text-2xl font-bold text-center text-gray-900 mb-2"
        >
          New Version Available
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          A new version of the app is ready. Reload now to get the latest features and improvements.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLater}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
          >
            Later
          </button>
          <button
            onClick={onReload}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 order-1 sm:order-2"
          >
            Reload Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
