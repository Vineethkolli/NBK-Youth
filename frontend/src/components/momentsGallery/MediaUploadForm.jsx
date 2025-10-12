import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

function MediaUploadForm({ momentTitle, onClose, onSubmit }) {
  const [files, setFiles] = useState([]);
  const [filesPreview, setFilesPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Check for maximum number of files
    if (selectedFiles.length > 20) {
      toast.error('You can upload a maximum of 20 files at a time');
      return;
    }

    // Check for total size < 1GB
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 1024 * 1024 * 1024) {
      toast.error('Total file size should be less than 1GB');
      return;
    }

    const previews = selectedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));

    setFiles(selectedFiles);
    setFilesPreview(previews);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filesPreview.filter((_, i) => i !== index);

    try {
      URL.revokeObjectURL(filesPreview[index].url);
    } catch (err) {}

    setFiles(newFiles);
    setFilesPreview(newPreviews);

    if (newFiles.length === 0) {
      setFileInputKey(Date.now());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(files);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">Upload Media</h2>
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
            <label className="block text-sm font-medium text-gray-700">
              Upload Files * (Maximum 20 files)
            </label>
            <input
              key={fileInputKey}
              type="file"
              required
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                         file:rounded-full file:border-0 file:text-sm file:font-semibold 
                         file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {filesPreview.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {filesPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    {preview.type === 'image' ? (
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ) : (
                      <video
                        src={preview.url}
                        className="w-full h-24 object-cover rounded border"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            <Upload className={`h-5 w-5 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Uploading...' : 'Upload Media'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MediaUploadForm;
