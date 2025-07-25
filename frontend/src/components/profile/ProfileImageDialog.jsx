import { useState } from 'react';
import { X, Upload, Camera } from 'lucide-react';

function ProfileImageDialog({ image, onClose, onUpload }) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 15 * 1024 * 1024) {
      alert('Please upload an image less than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      await onUpload(selectedImage);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Profile Image</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="aspect-square max-h-[400px] overflow-hidden rounded-lg">
            {selectedImage || image ? (
              <img
                src={selectedImage || image}
                alt="Profile"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <span className="sr-only">Choose new image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            {selectedImage && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-indigo-600 
                  hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
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