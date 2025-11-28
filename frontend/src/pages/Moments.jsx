import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Youtube, Upload, FolderOpen, Copy, GripHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import MomentForm from '../components/moments/MomentForm';
import MomentGrid from '../components/moments/MomentGrid';
import MomentReorder from '../components/moments/MomentReorder';
import WatchMore from '../components/moments/WatchMore';

function Moments() {
  const { hasAccess } = useAuth();
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
    } catch {
      toast.error('Failed to fetch moments');
    }
  };


  const handleMomentFormSubmit = async (formDataOrObj) => {
    try {
      if (formType === 'youtube') {
        const endpoint = `${API_URL}/api/moments/youtube`;
        await axios.post(endpoint, formDataOrObj);
        toast.success('YouTube video added successfully');
        fetchMoments();
        return;
      }

if (formType === 'drive') {
  const endpoint = `${API_URL}/api/moments/drive`;
  
  // Detect folder URL
  const isFolder = formDataOrObj.url.includes('drive.google.com/drive/folders/');
  
  await axios.post(endpoint, formDataOrObj);
  
  toast.success(
    isFolder 
      ? 'Drive folder added successfully.' 
      : 'Drive media added successfully. Ensure View access is enabled.'
  );
  
  fetchMoments();
  return;
}

      if (formType === 'copy-service-drive') {
        const endpoint = `${API_URL}/api/moments/copy-to-service-drive`;
        await axios.post(endpoint, formDataOrObj);
        toast.success('Drive media copied and added successfully');
        fetchMoments();
        return;
      }

      if (formType === 'upload') {
        if (formDataOrObj && formDataOrObj._id) {
          const updatedMoment = formDataOrObj;
          setMoments((prev) => [updatedMoment, ...prev]); 
        } else {
          await fetchMoments();
        }
        return;
      }

      throw new Error('Unsupported form type');
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to submit moment');
      throw error;
    }
  };

  const handleSyncDriveFolder = async (momentId) => {
  try {
    const promise = axios.post(`${API_URL}/api/moments/${momentId}/sync`);
    await toast.promise(promise, {
      loading: 'Syncing folder...',
      success: 'Drive folder synced successfully!',
      error: 'Failed to sync folder',
    });

    // After sync, refetch moments to get updated media files
    await fetchMoments();
  } catch (error) {
    console.error(error);
  }
};


  const handleDeleteMoment = async (momentId) => {
    if (!window.confirm('Are you sure you want to delete this moment?')) return;

    const promise = axios.delete(`${API_URL}/api/moments/${momentId}`);
    await toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        setMoments((prev) => prev.filter((m) => m._id !== momentId));
        return 'Moment deleted successfully';
      },
      error: 'Failed to delete moment',
    });
  };

  const handleDeleteGalleryFile = async (momentId, mediaId) => {
    const promise = axios.delete(`${API_URL}/api/moments/${momentId}/gallery/${mediaId}`);
    await toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        setMoments((prev) =>
          prev.map((moment) =>
            moment._id === momentId
              ? { ...moment, mediaFiles: moment.mediaFiles.filter((mf) => mf._id !== mediaId) }
              : moment
          )
        );
        return 'Gallery File deleted successfully';
      },
      error: 'Failed to delete gallery file',
    });
  };

  const handleUpdateMomentTitle = async (id, newTitle) => {
    try {
      await axios.patch(`${API_URL}/api/moments/${id}/title`, { title: newTitle });
      setMoments((prev) =>
        prev.map((moment) => (moment._id === id ? { ...moment, title: newTitle } : moment))
      );
      toast.success('Moment title updated successfully');
    } catch {
      toast.error('Failed to update moment title');
    }
  };

  const handleMomentOrderSave = async (reorderedMoments) => {
    try {
      await axios.put(`${API_URL}/api/moments/order`, { moments: reorderedMoments });
      setMoments(reorderedMoments);
      setIsReorderMode(false);
      toast.success('Moment order updated successfully');
    } catch {
      toast.error('Failed to update moment order');
    }
  };

  const handleGalleryOrderSave = async (momentId, reorderedMediaFiles) => {
    try {
      await axios.put(`${API_URL}/api/moments/${momentId}/gallery/order`, {
        mediaFiles: reorderedMediaFiles,
      });
      setMoments((prev) =>
        prev.map((moment) =>
          moment._id === momentId ? { ...moment, mediaFiles: reorderedMediaFiles } : moment
        )
      );
      toast.success('Gallery order updated successfully');
    } catch {
      toast.error('Failed to update gallery order');
    }
  };


  const handleUploadMediaInGallery = (arg1) => {
    if (arg1 && typeof arg1 === 'object' && arg1._id) {
      const updatedMoment = arg1;
      setMoments((prev) => prev.map((m) => (m._id === updatedMoment._id ? updatedMoment : m)));
      toast.success('Media uploaded successfully');
      return updatedMoment;
    }

    (async () => {
      await fetchMoments();
    })();

    return null;
  };

  const handleCopyToServiceDriveGallery = async (momentId, driveUrl) => {
    try {
      const { data: updatedMoment } = await axios.post(
        `${API_URL}/api/moments/${momentId}/gallery/copy-to-service-drive`,
        { url: driveUrl }
      );

      setMoments((prev) =>
        prev.map((moment) => (moment._id === momentId ? updatedMoment : moment))
      );

      toast.success('Drive media copied and added successfully');
      return updatedMoment;
    } catch (error) {
      console.error(error);
      toast.error('Failed to copy drive media');
    }
  };

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };


  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-0 py-0">
      {hasAccess('Privileged') && (
        <div className="flex justify-start items-center mb-6 space-x-3">
          <button onClick={() => openForm('youtube')} className="btn-primary">
            <Youtube className="h-4 w-4 mr-2" /> Add YouTube
          </button>
          <button onClick={() => openForm('upload')} className="btn-primary">
            <Upload className="h-4 w-4 mr-2" /> Upload Media
          </button>
          <button onClick={() => openForm('copy-service-drive')} className="btn-primary">
            <Copy className="h-4 w-4 mr-2" /> Copy Drive
          </button>
          <button onClick={() => openForm('drive')} className="btn-primary">
            <FolderOpen className="h-4 w-4 mr-2" /> Add Drive
          </button>
          <button
            onClick={() => setIsReorderMode(true)}
            disabled={isReorderMode}
            className={`btn-secondary ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <GripHorizontal className="h-4 w-4 mr-2" /> Reorder Mode
          </button>
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setIsReorderMode(false);
            }}
            className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
          >
            <Edit2 className="h-4 w-4 mr-2" /> {isEditMode ? 'Done' : 'Edit Mode'}
          </button>
        </div>
      )}

      <WatchMore />

      {isReorderMode ? (
        <MomentReorder
          moments={moments}
          onSave={handleMomentOrderSave}
          onCancel={() => setIsReorderMode(false)}
          onGalleryOrderSave={handleGalleryOrderSave}
        />
      ) : (
        <MomentGrid
          moments={moments}
          isEditMode={isEditMode}
          onDeleteMoment={handleDeleteMoment}
          onDeleteGalleryFile={handleDeleteGalleryFile}
          onUpdateMomentTitle={handleUpdateMomentTitle}
          onUploadMediaInGallery={handleUploadMediaInGallery}
          onCopyToServiceDriveGallery={handleCopyToServiceDriveGallery}
          onGalleryOrderSave={handleGalleryOrderSave}
          onSyncDriveFolder={handleSyncDriveFolder}
        />
      )}

      {showForm && (
        <MomentForm type={formType} onClose={() => setShowForm(false)} onSubmit={handleMomentFormSubmit} />
      )}
    </div>
  );
}

export default Moments;
