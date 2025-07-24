import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Youtube, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import MomentForm from '../components/moments/MomentForm';
import MomentGrid from '../components/moments/MomentGrid';

function Moments() {
  const { user } = useAuth();
  const [moments, setMoments] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
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
      if (formType === 'youtube') {
        await axios.post(`${API_URL}/api/moments/youtube`, formData);
      } else {
        await axios.post(`${API_URL}/api/moments/media`, formData);
      }
      toast.success('Moment added successfully');
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
      toast.success('Moment deleted successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to delete moment');
    }
  };

  const handleUpdateTitle = async (id, newTitle) => {
    try {
      await axios.patch(`${API_URL}/api/moments/${id}/title`, { title: newTitle });
      toast.success('Title updated successfully');
      fetchMoments();
    } catch (error) {
      toast.error('Failed to update title');
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => openForm('youtube')}
              className="btn-primary"
            >
              <Youtube className="h-4 w-4 mr-2" />
              Add YouTube Video
            </button>
            <button
              onClick={() => openForm('media')}
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
              {isEditMode ? 'Done Editing' : 'Edit Mode'}
            </button>
          </div>
        </div>
      )}

      <MomentGrid
        moments={moments}
        isEditMode={isEditMode}
        onDelete={handleDelete}
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