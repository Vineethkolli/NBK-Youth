import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const COLLECTION_OPTIONS = ['Stats', 'Income', 'Expense', 'Event'];

function HistoryForm({ snapshots, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    snapshotName: '',
    selectedCollections: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCollectionToggle = (collection) => {
    setFormData(prev => ({
      ...prev,
      selectedCollections: prev.selectedCollections.includes(collection)
        ? prev.selectedCollections.filter(c => c !== collection)
        : [...prev.selectedCollections, collection]
    }));
  };

  const getSelectedSnapshot = () => {
    if (!formData.snapshotName) return null;
    const parts = formData.snapshotName.trim().split(' ');
    const year = parts.pop();
    const eventName = parts.join(' ');
    return snapshots.find(s => s.eventName === eventName && s.year === parseInt(year));
  };

  const getAvailableCollections = () => {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return [];

    const available = [];
    if (snapshot.stats && Object.keys(snapshot.stats).length > 0) {
      available.push('Stats');
    }

    Object.keys(snapshot.collections || {}).forEach(key => {
      if (snapshot.collections[key] && snapshot.collections[key].length > 0) {
        if (key === 'Income') available.push('Income');
        if (key === 'Expense') available.push('Expense');
        if (key === 'Event') available.push('Event');
      }
    });

    return available;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.snapshotName) {
      toast.error('Please select a snapshot');
      return;
    }
    if (formData.selectedCollections.length === 0) {
      toast.error('Please select at least one collection');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Snapshot *
            </label>
            <select
              required
              value={formData.snapshotName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  snapshotName: e.target.value,
                  selectedCollections: []
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Snapshot</option>
              {snapshots.map((snapshot) => (
                <option
                  key={snapshot._id}
                  value={`${snapshot.eventName} ${snapshot.year}`}
                >
                  {snapshot.eventName} {snapshot.year}
                </option>
              ))}
            </select>
          </div>

          {formData.snapshotName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collections *
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {getAvailableCollections().map((collection) => (
                  <label key={collection} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedCollections.includes(collection)}
                      onChange={() => handleCollectionToggle(collection)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      {collection}
                    </span>
                  </label>
                ))}
              </div>
              {getAvailableCollections().length === 0 && (
                <p className="text-sm text-gray-500">
                  No collections available in this snapshot
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HistoryForm;
