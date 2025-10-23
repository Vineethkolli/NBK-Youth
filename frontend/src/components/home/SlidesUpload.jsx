import { useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { API_URL } from '../../utils/config';

export default function SlidesUpload({ open, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;

    const existingCount = files.length;
    if (existingCount + selected.length > 15) {
      toast.error('You can upload a maximum of 15 files at a time');
      return;
    }

    const validFiles = [];
    for (const file of selected) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        toast.error(`"${file.name}" is not a valid image or video`);
        continue;
      }

      if (isImage && file.size > 30 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 30MB limit. Images must be under 30MB.`);
        continue;
      }
      if (isVideo && file.size > 90 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 90MB limit. Videos must be under 90MB.`);
        continue;
      }

      validFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    try {
      URL.revokeObjectURL(files[index].previewUrl);
    } catch (e) {}
    setFiles(files.filter((_, i) => i !== index));
    if (files.length === 1) setFileInputKey(Date.now());
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (isUploading || files.length === 0) return;

    setIsUploading(true);
    setUploadPercent(0);

    try {
      let totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
      let uploadedSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await uploadDirectToCloudinary({
          file: file.file,
          folder: 'HomepageSlides',
          resourceType: file.type,
          onProgress: (percent) => {
            const fileUploaded = (percent / 100) * file.file.size;
            const totalPercent = ((uploadedSize + fileUploaded) / totalSize) * 100;
            setUploadPercent(Math.round(totalPercent));
          },
        });

        uploadedSize += file.file.size;

        await axios.post(`${API_URL}/api/homepage/slides`, {
          type: file.type,
          url: uploaded.url,
          mediaPublicId: uploaded.publicId,
        });
      }

      toast.success(`${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`);
      setFiles([]);
      setFileInputKey(Date.now());
      setUploadPercent(0);
      onUploaded?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload slides');
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Image className="h-5 w-5 mr-2 text-indigo-600" />
            <h2 className="text-xl font-semibold">Add Slides</h2>
          </div>
          <button
            onClick={() => {
              setFiles([]);
              setFileInputKey(Date.now());
              onClose?.();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Files * (Max 15 files)
            </label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*,video/*"
              multiple
              required
              disabled={isUploading}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                         file:rounded-full file:border-0 file:text-sm file:font-semibold 
                         file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Files ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {files.map((p, i) => (
                  <div key={i} className="relative">
                    {p.type === 'image' ? (
                      <img
                        src={p.previewUrl}
                        alt={`Preview ${i}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ) : (
                      <video
                        src={p.previewUrl}
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
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || files.length === 0}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            <Upload className={`h-5 w-5 ${isUploading ? 'animate-spin' : ''}`} />
            {isUploading ? `Uploading... ${uploadPercent}%` : 'Upload Slides'}
          </button>
        </form>
      </div>
    </div>
  );
}
