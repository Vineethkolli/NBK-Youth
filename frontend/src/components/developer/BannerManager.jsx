import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, ExternalLink} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';


function StatusToggle({ banner, onToggle }) {
  const isEnabled = banner.status === 'enabled';

  return (
    <button
      onClick={() => onToggle(banner)}
      className={`relative w-9 h-4 flex items-center rounded-full transition-colors duration-300 ${
        isEnabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute left-0 top-0 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isEnabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
      </span>
    </button>
  );
}



export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
const imageInputRef = useRef(null);
const videoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '',
    video: '',
    imageCloudinary: '',
    videoCloudinary: '',
    status: 'disabled',
    periodicity: 1,
    duration: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/banners`);
      setBanners(data);
    } catch (err) {
      toast.error('Failed to fetch banners');
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error('File size should be less than 200MB');
      return;
    }
    // Only allow one of image or video at a time (including preview)
    if ((type === 'image' && (formData.video || formData.videoPreview)) || (type === 'video' && (formData.image || formData.imagePreview))) {
      toast.error('You can only select either an image or a video, not both.');
      if (type === 'image' && imageInputRef.current) imageInputRef.current.value = '';
      if (type === 'video' && videoInputRef.current) videoInputRef.current.value = '';
      return;
    }
    let newForm = { ...formData };
    if (type === 'image' && formData.imageCloudinary) {
      newForm.deleteImageCloudinary = true;
      newForm.imageCloudinary = '';
    }
    if (type === 'video' && formData.videoCloudinary) {
      newForm.deleteVideoCloudinary = true;
      newForm.videoCloudinary = '';
    }
    newForm[type] = file;
    newForm[`${type}Preview`] = URL.createObjectURL(file);
    if (type === 'image') {
      newForm.video = '';
      newForm.videoPreview = undefined;
    } else {
      newForm.image = '';
      newForm.imagePreview = undefined;
    }
    setFormData(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('message', formData.message);
      data.append('status', formData.status);
      data.append('periodicity', formData.periodicity);
      data.append('duration', formData.duration);
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }
      if (formData.video instanceof File) {
        data.append('video', formData.video);
      }
      if (formData.deleteImageCloudinary) {
        data.append('deleteImageCloudinary', 'true');
      }
      if (formData.deleteVideoCloudinary) {
        data.append('deleteVideoCloudinary', 'true');
      }

      let response;
      if (formData._id) {
        response = await axios.put(`${API_URL}/api/banners/${formData._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Banner updated successfully');
      } else {
        response = await axios.post(`${API_URL}/api/banners`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Banner created successfully');
      }
      await fetchBanners();
      setShowForm(false);
      resetForm();
      // No need to setFormData after update, banners are refetched and modal is closed
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    let editData = { ...banner };
    if (editData.image && editData.video) {
      editData.video = '';
    }
    setFormData({
      ...editData,
      imageCloudinary: editData.image || '',
      videoCloudinary: editData.video || '',
      imagePreview: undefined,
      videoPreview: undefined
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/banners/${id}`);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch {
      toast.error('Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      if (banner.status === 'disabled') {
        const currentEnabled = banners.find(b => b.status === 'enabled');
        if (currentEnabled) {
          toast.error('Please disable the currently enabled banner first');
          return;
        }
      }
  
      // Now toggle the clicked banner’s status
      const updatedStatus = banner.status === 'enabled' ? 'disabled' : 'enabled';
      await axios.put(`${API_URL}/api/banners/${banner._id}`, {
        ...banner,
        status: updatedStatus,
      });
  
      toast.success(`Banner ${updatedStatus}`);
      await fetchBanners();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };
  
  // Render message text, replacing URLs with an "Open" button
  const renderMessageWithLinks = (text) => {
  if (!text) return null; // Prevent .split() on undefined
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) =>
    /https?:\/\//.test(part) ? (
      <button
        key={idx}
        onClick={() => window.open(part, '_blank')}
        className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
      >
        Open <ExternalLink className="w-4 h-4 ml-1" />
      </button>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
};


  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      image: '',
      video: '',
      status: 'disabled',
      periodicity: 1,
      duration: 0,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Popup Banner</h2>
        <div className="space-x-2">
          
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-2 py-2 bg-indigo-600 text-white rounded-md"
          >
            <Plus className="inline-block mr-1 h-4 w-4" />
            Add
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2 py-2 rounded-md ${
              isEditing ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          ><Edit2 className="inline-block mr-1 h-4 w-4 mr-1 " />
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Banner List  */}
      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner._id}
            className="border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4"
          >
            {/* Left: Banner Details */}
            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-lg">{banner.title}</h3>
              <p className="text-gray-700">{renderMessageWithLinks(banner.message)}</p>

              {banner.image && (
                <img
                  src={banner.image}
                  alt="Banner preview"
                  className="mt-2 max-h-24 object-contain border rounded"
                />
              )}

              {banner.video && (
                <video
                  src={banner.video}
                  controls
                  className="mt-2 max-h-24 object-contain border rounded"
                />
              )}

              <p className="text-sm text-gray-500">
                Status: {banner.status} &nbsp;|&nbsp;
                Shows: {banner.periodicity} time{banner.periodicity > 1 ? 's' : ''} &nbsp;|&nbsp;
                Duration: {banner.duration}s
              </p>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(banner)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  className={`text-red-600 hover:text-red-800 ${deletingId === banner._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={deletingId === banner._id}
                  style={deletingId === banner._id ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <StatusToggle banner={banner} onToggle={handleToggleStatus} />
            )}
          </div>
        ))}
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {formData._id ? 'Edit Banner' : 'Add Banner'}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData(f => ({ ...f, title: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData(f => ({ ...f, message: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image
                </label>
                <input
  type="file"
  accept="image/*"
  ref={imageInputRef}
  onChange={(e) => handleFileChange(e, 'image')}
  className="mt-1 block w-full"
/>
                {/* Show image preview only if no video is selected */}
                {(!formData.video && (formData.imagePreview || (formData.image && typeof formData.image === 'string'))) && (
                  <div className="relative mt-2 h-32 w-full">
                    <img
                      src={formData.imagePreview || formData.image}
                      alt="Preview"
                      className="h-full object-contain"
                    />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(f => ({
                      ...f,
                      image: '',
                      imagePreview: undefined,
                      imageCloudinary: '',
                      deleteImageCloudinary: f.imageCloudinary ? true : false
                    }));
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                  className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video
                </label>
                <input
  type="file"
  accept="video/*"
  ref={videoInputRef}
  onChange={(e) => handleFileChange(e, 'video')}
  className="mt-1 block w-full"
/>
                {/* Show video preview only if no image is selected */}
                {(!formData.image && (formData.videoPreview || (formData.video && typeof formData.video === 'string'))) && (
                  <div className="relative mt-2 h-32 w-full">
                    <video
                      src={formData.videoPreview || formData.video}
                      controls
                      className="h-full object-contain"
                    />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(f => ({
                      ...f,
                      video: '',
                      videoPreview: undefined,
                      videoCloudinary: '',
                      deleteVideoCloudinary: f.videoCloudinary ? true : false
                    }));
                    if (videoInputRef.current) videoInputRef.current.value = '';
                  }}
                  className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Periodicity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.periodicity}
                    onChange={(e) =>
                      setFormData(f => ({
                        ...f,
                        periodicity: parseInt(e.target.value, 10),
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                      focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData(f => ({
                        ...f,
                        duration: parseInt(e.target.value, 10),
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                      focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md ${
                    submitting
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {submitting
                    ? (formData._id ? 'Updating...' : 'Creating...')
                    : (formData._id ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
