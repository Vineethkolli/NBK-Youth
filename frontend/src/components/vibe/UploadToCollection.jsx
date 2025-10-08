import { useState } from 'react';
import { X, Music, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { API_URL } from '../../utils/config';

function UploadToCollectionForm({ collection, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    songName: '',
    file: null,
    filePreview: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload a valid audio file');
      return;
    }

    if (file.size > 90 * 1024 * 1024) {
      toast.error('Audio file must be smaller than 90MB');
      return;
    }

    setFormData((f) => ({
      ...f,
      file,
      filePreview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file || isUploading) return;

    if (formData.file.size > 90 * 1024 * 1024) {
      toast.error('Audio file must be smaller than 90MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadDirectToCloudinary({
        file: formData.file,
        folder: 'Vibe',
        resourceType: 'video', // Cloudinary treats audio as "video"
        onProgress: (p) => setUploadProgress(p),
      });

      await axios.post(`${API_URL}/api/collections/${collection._id}/songs`, {
        name: formData.songName,
        url: uploaded.url,
        mediaPublicId: uploaded.publicId,
      });

      toast.success('Song uploaded successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload song');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetFile = () => {
    setFormData((f) => ({ ...f, file: null, filePreview: null, songName: '' }));
    setFileInputKey(Date.now());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Music className="h-5 w-5 mr-2 text-indigo-600" />
            <h2 className="text-xl font-semibold">
              Upload to {collection.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Collection Name
            </label>
            <input
              type="text"
              value={collection.name}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Song Name *
            </label>
            <input
              type="text"
              required
              value={formData.songName}
              onChange={(e) =>
                setFormData({ ...formData, songName: e.target.value })
              }
              placeholder="Enter song name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Audio File *
            </label>
            <input
              key={fileInputKey}
              type="file"
              required
              accept="audio/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-full file:border-0 file:text-sm file:font-semibold 
                file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {formData.filePreview && (
            <div className="relative mt-4">
              <audio controls src={formData.filePreview} className="w-full" />
              <button
                type="button"
                onClick={resetFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                title="Remove audio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

<button
  type="submit"
  disabled={isUploading || !formData.file}
  className="w-full flex justify-center items-center py-2 px-4 border border-transparent 
    rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
    hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-indigo-500 disabled:opacity-50"
>
  {isUploading ? (
    <>
      <Upload className="animate-spin h-5 w-5 mr-2" />
      Uploading...
      <span className="ml-2 text-sm text-white">{uploadProgress}%</span>
    </>
  ) : (
    'Upload Song'
  )}
</button>
        </form>
      </div>
    </div>
  );
}

export default UploadToCollectionForm;
