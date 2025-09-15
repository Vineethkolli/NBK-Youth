import { useState } from 'react';

function TimeForm({ onSubmit, onClose }) {
  const [timeData, setTimeData] = useState({
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  });

  const handleSubmit = () => {
    const totalMilliseconds = 
      (timeData.minutes * 60 * 1000) + 
      (timeData.seconds * 1000) + 
      timeData.milliseconds;
    onSubmit(totalMilliseconds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Enter Time</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                value={timeData.minutes}
                onChange={(e) => setTimeData({ ...timeData, minutes: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={timeData.seconds}
                onChange={(e) => setTimeData({ ...timeData, seconds: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Milliseconds
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={timeData.milliseconds}
                onChange={(e) => setTimeData({ ...timeData, milliseconds: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeForm;
