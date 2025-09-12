import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Youtube, Upload, FolderOpen, GripHorizontal, Plus } from 'lucide-react';
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
  }, []); // Fetch only on initial mount

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
      let hasVideo = false;

      switch (formType) {
        case 'youtube':
          endpoint = `${API_URL}/api/moments/youtube`;
          successMessage = 'YouTube video added successfully';
          break;
        case 'drive':
          endpoint = `${API_URL}/api/moments/drive`;
          successMessage = 'Drive media added successfully. Ensure View access is enabled.';
          break;
        case 'drive-media':
          endpoint = `${API_URL}/api/moments/drive-media`;
          successMessage = 'Drive media copied and added successfully. Ensure View access is enabled.';
          break;
        case 'upload':
          endpoint = `${API_URL}/api/moments/upload`;
          successMessage = 'Media uploaded successfully.';
          for (const value of formData.values()) {
            if (value instanceof File && value.type.startsWith('video/')) {
              hasVideo = true;
              break;
            }
          }
          break;
        default:
          throw new Error('Invalid form type');
      }

      await axios.post(endpoint, formData);
      
      if (hasVideo) {
        toast.success('For videos, processing may take a few minutes before playback is available.', {
          duration: 4000,
        });
      }
      toast.success(successMessage);

      fetchMoments(); // Refresh after creating a new moment
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (momentId) => {
    if (!window.confirm('Are you sure you want to delete this moment?')) return;

    const promise = axios.delete(`${API_URL}/api/moments/${momentId}`);
    await toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        setMoments(prevMoments => prevMoments.filter(m => m._id !== momentId));
        return 'Media deleted successfully';
      },
      error: 'Failed to delete moment',
    });
  };

  const handleDeleteMediaFile = async (momentId, mediaId) => {
    const promise = axios.delete(`${API_URL}/api/moments/${momentId}/media/${mediaId}`);
    await toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        setMoments(prevMoments =>
          prevMoments.map(moment => {
            if (moment._id === momentId) {
              const updatedMediaFiles = moment.mediaFiles.filter(mf => mf._id !== mediaId);
              return { ...moment, mediaFiles: updatedMediaFiles };
            }
            return moment;
          })
        );
        return 'Media deleted successfully';
      },
      error: 'Failed to delete media',
    });
  };

  const handleUpdateTitle = async (id, newTitle) => {
    try {
      await axios.patch(`${API_URL}/api/moments/${id}/title`, { title: newTitle });
      setMoments(prevMoments =>
          prevMoments.map(moment =>
              moment._id === id ? { ...moment, title: newTitle } : moment
          )
      );
      toast.success('Media updated successfully');
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
      setMoments(prevMoments =>
        prevMoments.map(moment =>
          moment._id === momentId ? { ...moment, mediaFiles: reorderedMediaFiles } : moment
        )
      );
      toast.success('Media order updated successfully');
    } catch (error) {
      toast.error('Failed to update media order');
    }
  };

  const handleAddMediaToMoment = async (momentId, files) => {
    try {
      const data = new FormData();
      let hasVideo = false;
      files.forEach((file) => {
        data.append('files', file);
        if (file.type.startsWith('video/')) {
          hasVideo = true;
        }
      });

      const response = await axios.post(`${API_URL}/api/moments/${momentId}/media`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedMoment = response.data;

      setMoments(prevMoments =>
        prevMoments.map(moment =>
          moment._id === momentId ? updatedMoment : moment
        )
      );

      if (hasVideo) {
        toast.success('For videos, processing may take a few minutes before playback is available.', {
          duration: 4000,
        });
      }
      toast.success('Media uploaded successfully.');

      return updatedMoment;
    } catch (error) {
      throw error;
    }
  };

  const handleAddDriveMediaToMoment = async (momentId, driveUrl) => {
    try {
      const response = await axios.post(`${API_URL}/api/moments/${momentId}/drive-media`, {
        url: driveUrl
      });

      const updatedMoment = response.data;

      setMoments(prevMoments =>
        prevMoments.map(moment =>
          moment._id === momentId ? updatedMoment : moment
        )
      );

      toast.success('Drive media added successfully.');
      return updatedMoment;
    } catch (error) {
      throw error;
    }
  };

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };

  const isPrivilegedUser = ['developer', 'admin', 'financier'].includes(user?.role);

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-0 py-0">
      {isPrivilegedUser && (
        <div className="flex justify-start items-center mb-6 space-x-3">
          <button
            onClick={() => openForm('youtube')}
            className="btn-primary"
          >
            <Youtube className="h-4 w-4 mr-2" />
            Add YouTube
          </button>
           <button
            onClick={() => openForm('upload')}
            className="btn-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </button>
          <button
            onClick={() => openForm('drive-media')}
            className="btn-primary"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Drive Media
          </button>
          <button
            onClick={() => setIsReorderMode(true)}
            disabled={isReorderMode}
            className={`btn-secondary ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isReorderMode ? 'Reorder is active' : 'Enter reorder mode'}
          >
            <GripHorizontal className="h-4 w-4 mr-2" />
            Reorder Mode
          </button>
          <button
            onClick={() => { setIsEditMode(!isEditMode); setIsReorderMode(false); }}
            className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit Mode'}
          </button>
           <button
            onClick={() => openForm('drive')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Drive
          </button>

        </div>
      )}

      {isReorderMode ? (
        <MomentReorder
          moments={moments}
          onSave={handleOrderSave}
          onCancel={() => setIsReorderMode(false)}
          onMediaOrderSave={handleMediaOrderSave}
        />
      ) : (
        <MomentGrid
          moments={moments}
          isEditMode={isEditMode}
          onDelete={handleDelete}
          onDeleteMediaFile={handleDeleteMediaFile}
          onUpdateTitle={handleUpdateTitle}
          onAddMediaToMoment={handleAddMediaToMoment}
          onAddDriveMediaToMoment={handleAddDriveMediaToMoment}
          onMediaOrderSave={handleMediaOrderSave}
        />
      )}

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