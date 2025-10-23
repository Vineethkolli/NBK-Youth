import { useState } from 'react';
import { Upload, X, Plus, Edit2, Music } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function CollectionManager({ collections, onUpdate, isEditMode, onEditModeToggle, uploadMode, onUploadModeToggle }) {
  const { user } = useAuth();
  const [showNewUpload, setShowNewUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    collectionName: '',
    songs: [], // Array of { name: '', file: null, filePreview: null }
  });
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  const resetForm = () => {
    setFormData({
      collectionName: '',
      songs: [],
    });
    setFileInputKey(Date.now());
  };

  const handleNewUpload = async (e) => {
    e.preventDefault();
    if (formData.songs.length === 0 || isUploading) return;
  
    // Validate all files
    for (const song of formData.songs) {
      if (!song.name.trim()) {
        return toast.error('All songs must have a name');
      }
      if (!song.file) {
        return toast.error('All songs must have a file');
      }
      if (song.file.size > 90 * 1024 * 1024) {
        return toast.error(`Song "${song.name}" exceeds 90MB limit. File must be under 90MB.`);
      }
    }
  
    const existingCollection = collections.find(
      (col) => col.name.toLowerCase() === formData.collectionName.toLowerCase()
    );
    if (existingCollection) {
      return toast.error('Collection name already exists. Please choose a different name.');
    }
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      // Create collection first
      const collectionResponse = await axios.post(`${API_URL}/api/collections`, {
        name: formData.collectionName,
      });
  
      const uploadedSongs = [];
  
      for (let i = 0; i < formData.songs.length; i++) {
        const song = formData.songs[i];
  
        const uploaded = await uploadDirectToCloudinary({
          file: song.file,
          folder: 'Vibe',
          resourceType: 'video', // Cloudinary treats audio as 'video'
          onProgress: (percent) => {
            const totalProgress = ((i + percent / 100) / formData.songs.length) * 100;
            setUploadProgress(totalProgress);
          },
        });
  
        uploadedSongs.push({
          name: song.name,
          url: uploaded.url,
          mediaPublicId: uploaded.publicId,
        });
      }
  
      // Bulk upload songs to collection
      await axios.post(
        `${API_URL}/api/collections/${collectionResponse.data._id}/songs/bulk`,
        { songs: uploadedSongs }
      );
  
      toast.success(`Collection and ${formData.songs.length} songs created successfully`);
      setShowNewUpload(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create collection and upload songs');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };  

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 15) {
      toast.error('Maximum 15 files can be selected at once');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        toast.error(`File "${file.name}" is not a valid audio file`);
        continue;
      }

      if (file.size > 90 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 90MB limit. File must be under 90MB.`);
        continue;
      }

      validFiles.push({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        file,
        filePreview: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setFormData((f) => ({
        ...f,
        songs: [...f.songs, ...validFiles],
      }));
    }
  };

  const handleCloseForm = () => {
    setShowNewUpload(false);
    resetForm();
  };

  const updateSongName = (index, name) => {
    setFormData((f) => ({
      ...f,
      songs: f.songs.map((song, i) => 
        i === index ? { ...song, name } : song
      ),
    }));
  };

  const removeSong = (index) => {
    setFormData((f) => ({
      ...f,
      songs: f.songs.filter((_, i) => i !== index),
    }));
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
              className={`btn-secondary ${uploadMode ? 'bg-indigo-100' : ''}`}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                <label className="block text-sm font-medium text-gray-700">Audio Files * (Max 15 files)</label>
                <input
                  key={fileInputKey}
                  type="file"
                  required
                  accept="audio/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                    file:rounded-full file:border-0 file:text-sm file:font-semibold 
                    file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {formData.songs.length > 0 && (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-gray-700">Selected Songs ({formData.songs.length})</h3>
    <div className="grid gap-3">
      {formData.songs.map((song, index) => (
        <div
          key={index}
          className="relative p-3 bg-indigo-50 rounded-lg border border-indigo-100 shadow-sm"
        >
          <button
            type="button"
            onClick={() => removeSong(index)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:mr-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Song Name *</label>
              <input
                type="text"
                required
                value={song.name}
                onChange={(e) => updateSongName(index, e.target.value)}
                placeholder="Enter song name"
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />

              {song.filePreview && (
                <audio controls src={song.filePreview} className="w-full mt-2 rounded-md" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

<button
  type="submit"
  disabled={isUploading || formData.songs.length === 0}
  className="w-full flex justify-center items-center py-2 px-4 border border-transparent 
    rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
    hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-indigo-500 disabled:opacity-50"
>
  {isUploading ? (
    <>
      <Upload className="animate-spin h-5 w-5 mr-2" />
      Uploading...
      <span className="ml-2 text-sm text-white">{Math.round(uploadProgress)}%</span>
    </>
  ) : (
    `Upload ${formData.songs.length} Song${formData.songs.length !== 1 ? 's' : ''}`
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
