import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Youtube, Upload, FolderOpen, GripHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import MomentForm from '../components/moments/MomentForm';
import MomentGrid from '../components/moments/MomentGrid';
import MomentReorder from '../components/moments/MomentReorder';

function Moments() {
  const { user } = useAuth();
  const [moments, setMoments] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/moments`);
      setMoments(data);
    } catch (error) {
      toast.error('Failed to fetch moments');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      let endpoint = '';
      let successMessage = '';

      switch (formType) {
        case 'youtube':
          endpoint = `${API_URL}/api/moments/youtube`;
          successMessage = 'YouTube video added successfully';
          break;
        case 'drive':
          endpoint = `${API_URL}/api/moments/drive`;
          successMessage = 'Drive media added successfully. Ensure View access is enabled.';
          break;
        case 'upload':
          endpoint = `${API_URL}/api/moments/upload`;
          successMessage = 'Files uploaded successfully. It takes time to process based on video/image uploaded';
          break;
        default:
          throw new Error('Invalid form type');
      }

      await axios.post(endpoint, formData);
      toast.success(successMessage);
      fetchMoments();
    } catch (error) {
      throw error;
    }
  };

  const handleTogglePin = async (momentId) => {
    try {
      await axios.patch(`${API_URL}/api/moments/${momentId}/pin`);
      toast.success('Pin status updated');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const handleDelete = async (momentId) => {
    if (!window.confirm('Are you sure you want to delete this moment?')) return;
    try {
      await axios.delete(`${API_URL}/api/moments/${momentId}`);
      toast.success('Media deleted successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to delete moment');
    }
  };

  const handleDeleteMediaFile = async (momentId, mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      await axios.delete(`${API_URL}/api/moments/${momentId}/media/${mediaId}`);
      toast.success('Media deleted successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  const handleUpdateTitle = async (id, newTitle) => {
    try {
      await axios.patch(`${API_URL}/api/moments/${id}/title`, { title: newTitle });
      toast.success('Media updated successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to update title');
    }
  };

  const handleOrderSave = async (reorderedMoments) => {
    try {
      await axios.put(`${API_URL}/api/moments/order`, { moments: reorderedMoments });
      toast.success('Order updated successfully');
      setMoments(reorderedMoments);
      setIsReorderMode(false);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleMediaOrderSave = async (momentId, reorderedMediaFiles) => {
    try {
      await axios.put(`${API_URL}/api/moments/${momentId}/media-order`, { mediaFiles: reorderedMediaFiles });
      toast.success('Media order updated successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to update media order');
    }
  };

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };

  const isPrivilegedUser = ['developer', 'admin', 'financier'].includes(user?.role);

  if (isReorderMode) {
    return (
      <MomentReorder
        moments={moments}
        onSave={handleOrderSave}
        onCancel={() => setIsReorderMode(false)}
        onMediaOrderSave={handleMediaOrderSave}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-0 py-0">
      {isPrivilegedUser && (
        <div className="flex justify-start items-center mb-6 space-x-4">
          <button
            onClick={() => openForm('youtube')}
            className="btn-primary"
          >
            <Youtube className="h-4 w-4 mr-2" />
            Add YouTube
          </button>
          <button
            onClick={() => openForm('drive')}
            className="btn-primary"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Add Drive Media
          </button>
          <button
            onClick={() => openForm('upload')}
            className="btn-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit Mode'}
          </button>
          <button
            onClick={() => setIsReorderMode(true)}
            className="btn-secondary"
          >
            <GripHorizontal className="h-4 w-4 mr-2" />
            Reorder Mode
          </button>
        </div>
      )}

      <MomentGrid
        moments={moments}
        isEditMode={isEditMode}
        onDelete={handleDelete}
        onDeleteMediaFile={handleDeleteMediaFile}
        onTogglePin={handleTogglePin}
        onUpdateTitle={handleUpdateTitle}
      />

      {showForm && (
        <MomentForm
          type={formType}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

export default Moments;