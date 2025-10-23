import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

function EditNameModal({ isOpen, title = 'Edit', initialValue = '', onClose, onSubmit }) {
  const [name, setName] = useState(initialValue || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) setName(initialValue || '');
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setIsUpdating(true);
    try {
      await onSubmit(name);
      setIsUpdating(false);
      onClose();
    } catch (error) {
      setIsUpdating(false);
      const message = error?.response?.data?.message || error?.message || 'Failed to update';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} disabled={isUpdating}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                const capitalized = e.target.value.replace(/\b\w/g, (char) => char.toUpperCase());
                setName(capitalized);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              autoFocus
              disabled={isUpdating}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !isUpdating) onClose();
              }}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditNameModal;
