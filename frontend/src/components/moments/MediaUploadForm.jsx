import { useState } from 'react';
import axios from 'axios';
import { X, Upload, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';

function MediaUploadForm({ momentTitle, onClose, onSubmit, momentId }) {
  const [files, setFiles] = useState([]);
  const [filesPreview, setFilesPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0); // overall progress %
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

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

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

  const uploadFileInChunks = async (file, fileIdx) => {
    // 1. Request resumable session
    const sessionRes = await axios.post('/api/moments/resumable-session', {
      name: file.name,
      mimeType: file.type,
    });
    const uploadUrl = sessionRes.data.uploadUrl;
    let bytesUploaded = 0;
    let chunkIdx = 0;
    while (bytesUploaded < file.size) {
      const chunk = file.slice(bytesUploaded, bytesUploaded + CHUNK_SIZE);
      const chunkArrayBuffer = await chunk.arrayBuffer();
      const chunkBlob = new Blob([chunkArrayBuffer], { type: file.type });
      const chunkForm = new FormData();
      chunkForm.append('chunk', chunkBlob, file.name);
      chunkForm.append('uploadUrl', uploadUrl);
      chunkForm.append('startByte', bytesUploaded);
      chunkForm.append('endByte', Math.min(bytesUploaded + CHUNK_SIZE - 1, file.size - 1));
      chunkForm.append('totalBytes', file.size);
      chunkForm.append('fileName', file.name);
      chunkForm.append('mimeType', file.type);
      await axios.post('/api/moments/upload-chunk', chunkForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      bytesUploaded += CHUNK_SIZE;
      chunkIdx++;
      setCurrentFileProgress(Math.round((bytesUploaded / file.size) * 100));
      setProgress(Math.round(((fileIdx + bytesUploaded / file.size) / files.length) * 100));
    }
    // 2. Finalize upload and store metadata
    // Get fileId from uploadUrl
    const fileIdMatch = uploadUrl.match(/\/upload\/drive\/v3\/files\/(.*?)\?/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    const fileMeta = {
      name: file.name,
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      order: fileIdx,
      mediaPublicId: fileId,
    };
    await axios.post('/api/moments/finalize-upload', {
      momentId,
      fileMeta,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    setIsSubmitting(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        setCurrentFileProgress(0);
        await uploadFileInChunks(files[i], i);
      }
      toast.success('All files uploaded successfully');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsSubmitting(false);
      setProgress(0);
      setCurrentFileIndex(null);
      setCurrentFileProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">Add Media</h2>
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
            <label className="block text-sm font-medium text-gray-700">Upload Files * (Maximum 20 files)</label>
            <input
              key={fileInputKey}
              type="file"
              required
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Upload className="animate-spin h-5 w-5 mr-2" />
                Uploading...{' '}
                {progress}%
                {currentFileIndex !== null && (
                  <span className="ml-2 text-xs text-gray-700">File {currentFileIndex + 1}/{files.length}: {currentFileProgress}%</span>
                )}
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

export default MediaUploadForm;