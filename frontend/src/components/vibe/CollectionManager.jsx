import { useState } from 'react';
import { Upload, X, Plus, Edit2, Music } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function CollectionManager({ collections, onUpdate, isEditMode, onEditModeToggle, uploadMode, onUploadModeToggle }) {
  const { user } = useAuth();
  const [showNewUpload, setShowNewUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    collectionName: '',
    songName: '',
    file: null,
    filePreview: null
  });
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  const resetForm = () => {
    setFormData({
      collectionName: '',
      songName: '',
      file: null,
      filePreview: null
    });
    setFileInputKey(Date.now());
  };

  const handleNewUpload = async (e) => {
    e.preventDefault();
    if (!formData.file || isUploading) return;

    const existingCollection = collections.find(
      col => col.name.toLowerCase() === formData.collectionName.toLowerCase()
    );
    if (existingCollection) {
      return toast.error('Collection name already exists. Please choose a different name.');
    }

    setIsUploading(true);

    try {
      const collectionResponse = await axios.post(`${API_URL}/api/collections`, { 
        name: formData.collectionName 
      });

      const songData = new FormData();
      songData.append('name', formData.songName);
      songData.append('file', formData.file);

      await axios.post(
        `${API_URL}/api/collections/${collectionResponse.data._id}/songs`,
        songData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Collection and song created successfully');
      setShowNewUpload(false);
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error('Failed to create collection and upload song');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(f => ({
      ...f,
      file,
      filePreview: URL.createObjectURL(file)
    }));
  };

  const handleCloseForm = () => {
    setShowNewUpload(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {isPrivilegedUser && (
          <>
            <button
              onClick={() => setShowNewUpload(true)}
              className="btn-primary"
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'New Upload'}
            </button>

            <button
              onClick={onUploadModeToggle}
              className={`btn-secondary ${uploadMode ? 'bg-blue-100' : ''}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMode ? 'Done' : 'Upload Mode'}
            </button>

            <button
              onClick={onEditModeToggle}
              className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditMode ? 'Done' : 'Edit Mode'}
            </button>
          </>
        )}
      </div>

      {showNewUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Music className="h-5 w-5 mr-2 text-indigo-600" />
                <h2 className="text-xl font-semibold">New Collection Upload</h2>
              </div>
              <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleNewUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={formData.collectionName}
                  onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                  placeholder="Enter collection name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Song Name *</label>
                <input
                  type="text"
                  required
                  value={formData.songName}
                  onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                  placeholder="Enter song name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Audio File *</label>
                <input
                  key={fileInputKey}
                  type="file"
                  required
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                    file:rounded-full file:border-0 file:text-sm file:font-semibold 
                    file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {formData.filePreview && (
                <div className="relative mt-4">
                  <audio controls src={formData.filePreview} className="w-full " />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(f => ({ ...f, file: null, filePreview: null }));
                      setFileInputKey(Date.now());
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || !formData.file}
                className="w-full flex justify-center py-2 px-4 border border-transparent 
                  rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
                  hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-indigo-500 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Upload className="animate-spin h-5 w-5 mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload Song'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionManager;
