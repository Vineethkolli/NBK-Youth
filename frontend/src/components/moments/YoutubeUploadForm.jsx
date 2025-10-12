import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Youtube } from 'lucide-react';

export default function YoutubeUploadForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title, url });
      onClose(); 
    } catch (error) {
      toast.error(error.message || 'Failed to add YouTube video');
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
        <label className="block text-sm font-medium text-gray-700">YouTube URL *</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtu.be/... or https://www.youtube.com/..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent 
          rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
          hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-indigo-500 disabled:opacity-50 transition"
      >
        <Youtube
          className={`h-5 w-5 ${isSubmitting ? 'animate-spin' : ''}`}
        />
        {isSubmitting ? 'Adding...' : 'Add Video'}
      </button>
    </form>
  );
}
