import { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DriveUploadForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!url.includes('drive.google.com/file/d/')) {
      toast.error('Please enter a valid Google Drive File URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title, url });
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to add Drive file');
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
        <label className="block text-sm font-medium text-gray-700">Google Drive File URL *</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <div className="mt-2 text-xs text-gray-500">• Make sure the file has View access for everyone</div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent 
          rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
          hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-indigo-500 disabled:opacity-50"
      >
        <Upload
          className={`h-5 w-5 ${isSubmitting ? 'animate-spin' : ''}`}
        />
        {isSubmitting ? 'Adding...' : 'Add File'}
      </button>
    </form>
  );
}
