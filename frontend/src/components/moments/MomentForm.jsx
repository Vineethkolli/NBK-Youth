import { useState } from 'react';
import { X, Upload, Pin } from 'lucide-react';
import { toast } from 'react-hot-toast';

function MomentForm({ type, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    file: null,
    isPinned: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (
        type === 'youtube' && 
        !formData.url.includes('youtube.com') && 
        !formData.url.includes('youtu.be')
      ) {
        throw new Error('Please enter a valid YouTube URL');
      }    

      await onSubmit(formData, setUploadProgress);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to add moment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) {
      toast.error('File size should be less than 1GB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFormData({ ...formData, file: reader.result });
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">
              {type === 'youtube' ? 'Add YouTube Video' : 'Upload Media'}
            </h2>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
              className={`ml-2 p-1 rounded-full ${formData.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}
            >
              <Pin className="h-5 w-5" />
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title (Optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {type === 'youtube' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload File</label>
              <input
                type="file"
                required
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Upload className="animate-spin h-5 w-5 mr-2" />
                {type === 'youtube' ? 'Adding...' : 'Uploading...'}
              </>
            ) : (
              type === 'youtube' ? 'Add Video' : 'Upload Media'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MomentForm;