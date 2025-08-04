import { useState } from 'react';
import { Plus, Edit2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function CollectionManager({ collections, onUpdate, isEditMode, onEditModeToggle }) {
  const { user } = useAuth();
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showUploadSong, setShowUploadSong] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    collectionId: '',
    file: null
  });

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/collections`, { name: formData.name });
      toast.success('Collection created successfully');
      setShowCreateCollection(false);
      setFormData({ ...formData, name: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to create collection');
    }
  };

  const handleUploadSong = async (e) => {
    e.preventDefault();
    if (!formData.file || isUploading) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(formData.file);
    reader.onload = async () => {
      try {
        await axios.post(
          `${API_URL}/api/collections/${formData.collectionId}/songs`,
          {
            name: formData.name,
            file: reader.result
          }
        );
        toast.success('Song uploaded successfully');
        setShowUploadSong(false);
        setFormData({ name: '', collectionId: '', file: null });
        onUpdate();
      } catch (error) {
        toast.error('Failed to upload song');
      } finally {
        setIsUploading(false);
      }
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {isPrivilegedUser && (
          <>
            <button
              onClick={() => setShowCreateCollection(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </button>
            <button
              onClick={onEditModeToggle}
              className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditMode ? 'Done' : 'Edit Mode'}
            </button>
          
            <button
              onClick={() => setShowUploadSong(true)}
              className="btn-primary"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Song'}
            </button>
          </>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Create Collection</h3>
              <button onClick={() => setShowCreateCollection(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCollection}>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Collection Name"
                className="w-full border rounded-md p-2 mb-4"
              />
              <button type="submit" className="btn-primary w-full">
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Song Modal */}
      {showUploadSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload Song</h3>
              <button onClick={() => setShowUploadSong(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUploadSong}>
              <select
                required
                value={formData.collectionId}
                onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                className="w-full border rounded-md p-2 mb-4"
              >
                <option value="">Select Collection</option>
                {collections.map(collection => (
                  <option key={collection._id} value={collection._id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Song Name"
                className="w-full border rounded-md p-2 mb-4"
              />
              <input
                type="file"
                required
                accept="audio/*"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                className="w-full mb-4"
              />
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionManager;