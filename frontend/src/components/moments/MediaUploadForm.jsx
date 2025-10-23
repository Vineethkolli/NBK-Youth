import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

export default function MediaUploadForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [uploadPercent, setUploadPercent] = useState(0);

  // Google Drive upload helpers
  const uploadFileToDriveXHR = (file, accessToken, subfolderId, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const metadata = { name: file.name, parents: subfolderId ? [subfolderId] : undefined };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') onProgress(e.loaded, e.total);
        else if (typeof onProgress === 'function') onProgress(e.loaded, file.size);
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            const fileId = res.id;

            // Set public permission
            try {
              await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'reader', type: 'anyone' }),
              });
            } catch (permErr) {
              console.error('Failed to set permission for file', file.name, permErr);
            }

            resolve({
              id: fileId,
              name: file.name,
              url: `https://drive.google.com/uc?export=view&id=${fileId}`,
              type: file.type.startsWith('image/') ? 'image' : 'video',
              size: file.size,
            });
          } catch {
            reject(new Error('Invalid response from Drive upload'));
          }
        } else {
          reject(new Error(`Drive upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during Drive upload'));
      xhr.send(form);
    });
  };

  const uploadFilesSequentially = async (filesList, accessToken, subfolderId, onProgress) => {
    const totalBytes = filesList.reduce((s, f) => s + f.file.size, 0);
    let uploadedBytes = 0;
    const uploadedFiles = [];

    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      const perFileProgress = (loaded) => {
        const combined = Math.round(((uploadedBytes + loaded) / totalBytes) * 100);
        if (typeof onProgress === 'function') onProgress(combined);
      };

      const uploaded = await uploadFileToDriveXHR(f.file, accessToken, subfolderId, perFileProgress);
      uploadedFiles.push(uploaded);
      uploadedBytes += f.file.size;
      if (typeof onProgress === 'function') onProgress(Math.round((uploadedBytes / totalBytes) * 100));
    }

    return uploadedFiles;
  };

  // File input handler
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    if (files.length + selected.length > 25) {
      toast.error('You can upload a maximum of 25 files at a time');
      return;
    }

    const totalSize =
      selected.reduce((sum, f) => sum + f.size, 0) +
      files.reduce((sum, f) => sum + f.file.size, 0);
    if (totalSize > 1024 * 1024 * 1024) {
      toast.error('Total file size should be less than 1GB');
      return;
    }

    const newFiles = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    try {
      URL.revokeObjectURL(files[index].url);
    } catch {}
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (!newFiles.length) setFileInputKey(Date.now());
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) return toast.error('Please provide a title');
    if (!files.length) return toast.error('Please select at least one file');

    setIsSubmitting(true);
    setUploadPercent(0);
    try {
      const startRes = await axios.post(`${API_URL}/api/moments/upload/start`, { title });
      const { momentId, subfolderId, accessToken } = startRes.data;

      const uploadedFiles = await uploadFilesSequentially(files, accessToken, subfolderId, setUploadPercent);

      await axios.post(`${API_URL}/api/moments/upload/complete`, {
        momentId,
        mediaFiles: uploadedFiles.map((f) => ({
          name: f.name,
          url: f.url,
          type: f.type,
          id: f.id || f.mediaPublicId,
        })),
      });

      if (typeof onSubmit === 'function') onSubmit(startRes.data);

      toast.success('Moment Media uploaded successfully');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to upload media');
    } finally {
      setIsSubmitting(false);
      setUploadPercent(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Files * (Max 25 files)
        </label>
        <input
          key={fileInputKey}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
            file:rounded-full file:border-0 file:text-sm file:font-semibold 
            file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          required
        />

        {files.length > 0 && (
          <>
            <p className="mt-2 text-sm font-medium text-gray-700">Selected Files ({files.length})</p>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {f.type === 'image' ? (
                    <img
                      src={f.url}
                      alt={`Preview ${i}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ) : (
                    <video
                      src={f.url}
                      className="w-full h-24 object-cover rounded border"
                      controls
                    />
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
          </>
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
        {isSubmitting ? `Uploading... ${uploadPercent}%` : 'Upload Media'}
      </button>
    </form>
  );
}
