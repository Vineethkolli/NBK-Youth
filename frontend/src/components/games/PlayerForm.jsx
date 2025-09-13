import { useState } from 'react';
import { X } from 'lucide-react';

function PlayerForm({ onSubmit, onClose }) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(playerName);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add player');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add New Player</h3>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Player Name
            </label>
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => {
                const capitalized = e.target.value
                .replace(/\b\w/g, char => char.toUpperCase());
                setPlayerName(capitalized);
                setError('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
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
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlayerForm;