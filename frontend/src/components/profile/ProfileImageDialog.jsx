import { useState } from 'react';
import { X, Upload, Camera, Trash2, Loader2 } from 'lucide-react';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { useAuth } from '../../context/AuthContext';

function ProfileImageDialog({ image, onClose, onUpload }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert('Please upload an image less than 30MB');
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadDirectToCloudinary({
        file: selectedImage,
        folder: 'ProfileImages',
        resourceType: 'image',
        token: user?.token,
        onProgress: (p) => setUploadProgress(p),
      });

      await onUpload({ profileImage: uploaded.url, profileImagePublicId: uploaded.publicId });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!image) return;

    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onUpload(null); 
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Profile Image</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="aspect-square max-h-[400px] overflow-hidden rounded-lg relative">
            {previewUrl || image ? (
              <>
                {previewUrl ? (
                  <div className="relative h-full w-full">
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                        setFileInputKey(Date.now());
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <img
                    src={image}
                    alt="Profile"
                    className="w-full h-full object-contain"
                  />
                )}
                {image && !previewUrl && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`absolute top-2 right-2 rounded-full p-2 shadow-lg transition-colors text-white ${
                      isDeleting
                        ? 'bg-red-600 opacity-50 pointer-events-none'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title="Delete profile image"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <span className="sr-only">Choose new image</span>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading || isDeleting}
                className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {selectedImage && (
              <button
                onClick={handleUpload}
                disabled={isUploading || isDeleting}
                className={`inline-flex items-center px-4 py-2 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-indigo-600 
                  hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading{uploadProgress > 0 ? ` ${uploadProgress}%` : '...'}
                  </>
                ) : (
                  'Update'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileImageDialog;
