import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2,  Loader2, X, ExternalLink} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
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
  const [deleting, setDeleting] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '', 
    video: '', 
    status: 'disabled',
    periodicity: 1,
    duration: 0,
  });
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (file.size > 90 * 1024 * 1024) {
      toast.error('File size should be less than 90MB');
      return;
    }
    // If editing and replacing, set delete flag for old file
    if (type === 'image') {
      setFormData(f => ({
        ...f,
        image: file,
        video: '',
        deleteVideo: f.video && !f._id ? undefined : f.deleteVideo, // clear deleteVideo if not editing
        deleteImage: f._id && f.image && !(f.image instanceof File) ? true : undefined
      }));
    } else if (type === 'video') {
      setFormData(f => ({
        ...f,
        video: file,
        image: '',
        deleteImage: f.image && !f._id ? undefined : f.deleteImage, // clear deleteImage if not editing
        deleteVideo: f._id && f.video && !(f.video instanceof File) ? true : undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const isEdit = Boolean(formData._id);
      const url = isEdit
        ? `${API_URL}/api/banners/${formData._id}`
        : `${API_URL}/api/banners`;
      const method = isEdit ? 'put' : 'post';

      const isReplacingImage = formData.image instanceof File;
      const isReplacingVideo = formData.video instanceof File;

      const payload = {
        title: formData.title,
        message: formData.message,
        status: formData.status,
        periodicity: formData.periodicity,
        duration: formData.duration,
      };

      if (isEdit) {
        if (formData.deleteImage) payload.deleteImage = 'true';
        if (formData.deleteVideo) payload.deleteVideo = 'true';
      }

      if (isReplacingImage) {
        const uploaded = await uploadDirectToCloudinary({
          file: formData.image,
          folder: 'Banners',
          resourceType: 'image',
          onProgress: (p) => setUploadProgress(p),
        });
        payload.image = uploaded.url;
        payload.imagePublicId = uploaded.publicId;
      } else if (!isReplacingVideo && typeof formData.image === 'string') {
        payload.image = formData.image;
      }

      if (isReplacingVideo) {
        const uploaded = await uploadDirectToCloudinary({
          file: formData.video,
          folder: 'Banners',
          resourceType: 'video',
          onProgress: (p) => setUploadProgress(p),
        });
        payload.video = uploaded.url;
        payload.videoPublicId = uploaded.publicId;
      } else if (!isReplacingImage && typeof formData.video === 'string') {
        payload.video = formData.video;
      }

      await axios[method](url, payload);
      toast.success(`Banner ${isEdit ? 'updated' : 'created'} successfully`);
      setShowForm(false);
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (banner) => {
    setFormData(banner);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (deleting[id]) return; 
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`${API_URL}/api/banners/${id}`);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch {
      toast.error('Failed to delete banner');
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
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
  const renderMessageWithLinks = (text) =>
    text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) =>
      /https?:\/\//.test(part) ? (
        <button
          key={idx}
          onClick={() => window.open(part, '_blank')}
          className="inline-flex items-center px-1 py-0.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
        >
          Open <ExternalLink className="w-4 h-4 ml-1" />
        </button>
      ) : (
        <span key={idx}>{part}</span>
      )
    );

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
              isEditing ? 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-700'
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
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
              onClick={() => handleDelete(banner._id)}
              disabled={deleting[banner._id]}
              className={`p-2 rounded ${deleting[banner._id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
            >
              {deleting[banner._id] ? <Loader2 className="animate-spin h-5 w-5 text-red-600" /> : <Trash2 className="h-5 w-5 text-red-600" />}
            </button>
              </div>
            ) : (
              <StatusToggle banner={banner} onToggle={handleToggleStatus} />
            )}
          </div>
        ))}
      </div>

      {/* Banner Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'image')}
                  className="mt-1 block w-full text-sm text-gray-700
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
          disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!formData.video}
                />
                {formData.image && (
                  <div className="relative mt-2 h-32 w-full">
                    <img
                      src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image}
                      alt="Preview"
                      className="h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({
                        ...f,
                        image: '',
                        // If editing and there was an old image, set deleteImage flag
                        deleteImage: f._id && f.image && !(f.image instanceof File) ? true : undefined
                      }))}
                      className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {formData.video && (
                  <div className="text-xs text-red-500 mt-1">Remove video to select an image.</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  className="mt-1 block w-full text-sm text-gray-700
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
          disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!formData.image}
                />
                {formData.video && (
                  <div className="relative mt-2 h-32 w-full">
                    <video
                      src={formData.video instanceof File ? URL.createObjectURL(formData.video) : formData.video}
                      controls
                      className="h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({
                        ...f,
                        video: '',
                        // If editing and there was an old video, set deleteVideo flag
                        deleteVideo: f._id && f.video && !(f.video instanceof File) ? true : undefined
                      }))}
                      className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {formData.image && (
                  <div className="text-xs text-red-500 mt-1">Remove image to select a video.</div>
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
                  <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
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
  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {submitting
    ? uploadProgress > 0
      ? `${formData._id ? 'Updating' : 'Creating'}... ${uploadProgress}%`
      : formData._id ? 'Updating...' : 'Creating...' 
      : formData._id ? 'Update' : 'Create'}
</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
