import { useState } from 'react';
import { X, Upload, Pin, Youtube, FolderOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

function MomentForm({ type, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    files: [],
    filesPreview: [],
    isPinned: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (type === 'youtube') {
        if (!formData.url.includes('youtube.com') && !formData.url.includes('youtu.be')) {
          throw new Error('Please enter a valid YouTube URL');
        }
        await onSubmit(formData, setUploadProgress);
      } else if (type === 'drive') {
        if (!formData.url.includes('drive.google.com')) {
          throw new Error('Please enter a valid Google Drive URL');
        }
        await onSubmit(formData, setUploadProgress);
      } else if (type === 'upload') {
        if (formData.files.length === 0) {
          throw new Error('Please select at least one file');
        }
        
        const data = new FormData();
        data.append('title', formData.title);
        data.append('isPinned', formData.isPinned);
        
        formData.files.forEach((file) => {
          data.append('files', file);
        });
        
        await onSubmit(data, setUploadProgress);
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to add moment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate total size (1GB limit)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 1024 * 1024 * 1024) {
      toast.error('Total file size should be less than 1GB');
      return;
    }

    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));

    setFormData({
      ...formData,
      files,
      filesPreview: previews
    });
  };

  const removeFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    const newPreviews = formData.filesPreview.filter((_, i) => i !== index);
    
    // Revoke URL for removed file
    URL.revokeObjectURL(formData.filesPreview[index].url);
    
    setFormData({
      ...formData,
      files: newFiles,
      filesPreview: newPreviews
    });
  };

  const getFormTitle = () => {
    switch (type) {
      case 'youtube': return 'Add YouTube Video';
      case 'drive': return 'Add Drive Media';
      case 'upload': return 'Upload Media';
      default: return 'Add Media';
    }
  };

  const getFormIcon = () => {
    switch (type) {
      case 'youtube': return <Youtube className="h-5 w-5 mr-2" />;
      case 'drive': return <FolderOpen className="h-5 w-5 mr-2" />;
      case 'upload': return <Upload className="h-5 w-5 mr-2" />;
      default: return <Upload className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {getFormIcon()}
            <h2 className="text-xl font-semibold">{getFormTitle()}</h2>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
              className={`ml-3 p-1 rounded-full ${formData.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}
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
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter a descriptive title"
            />
          </div>

          {(type === 'youtube' || type === 'drive') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {type === 'youtube' ? 'YouTube URL' : 'Google Drive URL'} *
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={
                  type === 'youtube' 
                    ? 'https://youtube.com/watch?v=... or https://youtu.be/...'
                    : 'https://drive.google.com/file/d/...'
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {type === 'drive' && (
                <p className="mt-1 text-xs text-gray-500">
                  Make sure the file has View access for everyone
                </p>
              )}
            </div>
          )}

          {type === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Files *</label>
              <input
                key={fileInputKey}
                type="file"
                required
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              
              {formData.filesPreview.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                  {formData.filesPreview.map((preview, index) => (
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
                          muted
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

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
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
                {type === 'upload' ? 'Uploading...' : 'Adding...'}
              </>
            ) : (
              `Add ${type === 'youtube' ? 'Video' : 'Media'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MomentForm;