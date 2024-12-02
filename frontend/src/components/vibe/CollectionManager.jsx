import { useState } from 'react';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function CollectionManager({ collections, onUpdate }) {
  const { user } = useAuth();
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateSubCollection, setShowCreateSubCollection] = useState(false);
  const [showUploadSong, setShowUploadSong] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    collectionId: '',
    subCollectionId: '',
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

  const handleCreateSubCollection = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/collections/${formData.collectionId}/subcollections`, {
        name: formData.name
      });
      toast.success('Sub-collection created successfully');
      setShowCreateSubCollection(false);
      setFormData({ ...formData, name: '', collectionId: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to create sub-collection');
    }
  };

  const handleUploadSong = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('Please select a song file');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(formData.file);
    reader.onload = async () => {
      try {
        await axios.post(
          `${API_URL}/api/collections/${formData.collectionId}/subcollections/${formData.subCollectionId}/songs`,
          {
            name: formData.name,
            file: reader.result
          }
        );
        toast.success('Song uploaded successfully');
        setShowUploadSong(false);
        setFormData({ name: '', collectionId: '', subCollectionId: '', file: null });
        onUpdate();
      } catch (error) {
        toast.error('Failed to upload song');
      }
    };
  };

  const handleDelete = async (type, id, parentId = null) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      let url = `${API_URL}/api/collections`;
      if (type === 'collection') {
        url += `/${id}`;
      } else if (type === 'subcollection') {
        url += `/${parentId}/subcollections/${id}`;
      } else if (type === 'song') {
        const [collectionId, subCollectionId] = parentId.split('/');
        url += `/${collectionId}/subcollections/${subCollectionId}/songs/${id}`;
      }

      await axios.delete(url);
      toast.success('Item deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete item');
    }
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
              onClick={() => setShowCreateSubCollection(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sub-Collection
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`btn-secondary ${isEditing ? 'bg-red-100' : ''}`}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </>
        )}
        <button
          onClick={() => setShowUploadSong(true)}
          className="btn-primary"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Song
        </button>
        
      </div>

      {showCreateCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Collection</h2>
              <button onClick={() => setShowCreateCollection(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCollection}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Collection Name"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <button type="submit" className="btn-primary mt-4 w-full">
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreateSubCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Sub-Collection</h2>
              <button onClick={() => setShowCreateSubCollection(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSubCollection}>
              <div className="space-y-4">
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sub-Collection Name"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <button type="submit" className="btn-primary w-full">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upload Song</h2>
              <button onClick={() => setShowUploadSong(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUploadSong}>
              <div className="space-y-4">
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Collection</option>
                  {collections.map(collection => (
                    <option key={collection._id} value={collection._id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
                {formData.collectionId && (
                  <select
                    value={formData.subCollectionId}
                    onChange={(e) => setFormData({ ...formData, subCollectionId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Sub-Collection</option>
                    {collections
                      .find(c => c._id === formData.collectionId)
                      ?.subCollections.map(sub => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                )}
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Song Name"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full"
                  required
                />
                <button type="submit" className="btn-primary w-full">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionManager;