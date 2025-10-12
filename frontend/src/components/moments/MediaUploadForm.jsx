import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MediaUploadForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileChange = (e) => {
  const selected = Array.from(e.target.files);
  if (selected.length === 0) return;

  if (selected.length > 20) {
    toast.error('You can upload a maximum of 20 files at a time');
    return;
  }

  const totalSize = selected.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 1024 * 1024 * 1024) {
    toast.error('Total file size should be less than 1GB');
    return;
  }

  setFiles(selected);
  setPreviews(selected.map(file => ({
    file,
    url: URL.createObjectURL(file),
    type: file.type.startsWith('image/') ? 'image' : 'video'
  })));
};

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index].url);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    if (newFiles.length === 0) setFileInputKey(Date.now());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    const data = new FormData();
    data.append('title', title);
    files.forEach(file => data.append('files', file));

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Upload Files * (Max 20 files)</label>
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
        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                {p.type === 'image' ? (
                  <img src={p.url} alt={`Preview ${i}`} className="w-full h-24 object-cover rounded border" />
                ) : (
                  <video src={p.url} className="w-full h-24 object-cover rounded border" controls />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
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
  );
}
