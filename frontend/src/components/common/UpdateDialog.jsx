import { useState } from "react";

const UpdateDialog = ({ onUpdate }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-white border border-gray-200 shadow-xl rounded-2xl p-5">
      <h3 className="text-lg font-semibold text-gray-900">
        New Update Available
      </h3>

      <p className="text-sm text-gray-600 mt-1 mb-4 leading-snug">
        A newer version of the app is ready. Reload to update now.
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setVisible(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors duration-200"
        >
          Later
        </button>

        <button
          onClick={onUpdate}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors duration-200"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

export default UpdateDialog;
