import React from 'react';

export default function UpdatePrompt({ visible, onRefresh, onCancel }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90%] max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-800 p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">New update available</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          A new version of the application is ready. Refresh now to apply the update.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
