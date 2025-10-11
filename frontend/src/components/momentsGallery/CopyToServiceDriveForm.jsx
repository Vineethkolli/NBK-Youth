import { useState } from 'react';
import { X, FolderOpen, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

function CopyToServiceDriveForm({ momentTitle, onClose, onSubmit }) {
  const [driveUrl, setDriveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      toast.error('Please enter a Google Drive URL');
      return;
    }

    if (!driveUrl.includes('drive.google.com')) {
      toast.error('Please enter a valid Google Drive URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(driveUrl);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add Drive media');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">Add Drive Media</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={momentTitle}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Google Drive URL *</label>
            <input
              type="url"
              required
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... or https://drive.google.com/file/d/..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• For folders: All media files in the folder will be added</p>
              <p>• For single files: Only that file will be added</p>
              <p>• Make sure the folder/file has View access for everyone</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Upload className="animate-spin h-5 w-5 mr-2" />
                Adding...
              </>
            ) : (
              'Add Media'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CopyToServiceDriveForm;
