import { useState, useEffect } from 'react';
import { ArrowLeft, X, Download, Trash2, Plus, Edit2, GripHorizontal } from 'lucide-react';
import MediaGalleryReorder from './MediaGalleryReorder';
import MediaUploadForm from './MediaUploadForm';

function MediaGallery({ 
  moment, 
  onClose, 
  onMediaClick, 
  onDeleteMedia,
  onAddMedia,
  onMediaOrderSave,
  onMomentUpdate
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [localMediaFiles, setLocalMediaFiles] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local media files sorted by order (newest first if no order)
  useEffect(() => {
    if (moment.mediaFiles) {
      const sorted = [...moment.mediaFiles].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return b.order - a.order; // Higher order first
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setLocalMediaFiles(sorted);
      setHasChanges(false);
    }
  }, [moment.mediaFiles]);

  // Get embeddable thumbnail for both images and videos
  const getThumbnailUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  const getDriveDownloadUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1] 
      || url.match(/\/file\/d\/([^\/]+)/)?.[1] 
      || url.match(/open\?id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };

  const downloadFile = (downloadUrl, name) => {
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      if (name) a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      window.open(downloadUrl, '_blank', 'noopener');
    }
  };

  const handleAddMedia = async (files) => {
    try {
      await onAddMedia(moment._id, files);
      setShowUploadForm(false);
      if (onMomentUpdate) {
        onMomentUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    await onDeleteMedia(moment._id, mediaId);
    if (onMomentUpdate) {
      onMomentUpdate();
    }
  };

  const handleMediaOrderSave = async (reorderedMedia) => {
    try {
      setLocalMediaFiles(reorderedMedia);
      setIsReorderMode(false);
      setHasChanges(false);
      
      await onMediaOrderSave(moment._id, reorderedMedia);
      
      if (onMomentUpdate) {
        onMomentUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold">{moment.title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
           
          </button>
          <button
            onClick={() => { setIsEditMode(!isEditMode); setIsReorderMode(false); }}
            className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : ''}
          </button>
          <button
            onClick={() => setIsReorderMode(true)}
            disabled={isReorderMode}
            className={`btn-secondary ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isReorderMode ? 'Reorder is active' : 'Enter reorder mode'}
          >
            <GripHorizontal className="h-4 w-4 mr-2" />
            
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {isReorderMode ? (
        <MediaGalleryReorder
          mediaFiles={localMediaFiles}
          onSave={handleMediaOrderSave}
          onCancel={() => setIsReorderMode(false)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {localMediaFiles?.map((file, index) => (
              <div key={file._id} className="relative group">
                <div 
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => onMediaClick(localMediaFiles, index)}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={getThumbnailUrl(file.url)}
                      alt={file.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src='https://placehold.co/400x400/eeeeee/cccccc?text=Error'; 
                      }}
                    />
                    {file.type === 'video' && (
                      <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-70 rounded-full px-2 py-1">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
                        <span className="text-white text-xs font-medium">Video</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const dl = getDriveDownloadUrl(file.url);
                    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                      const link = document.createElement('a');
                      link.href = dl;
                      link.download = file.name;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      downloadFile(dl, file.name);
                    }
                  }}
                  className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>

                {/* Delete Button (Edit Mode) */}
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this media?')) {
                        handleDeleteMedia(file._id);
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <MediaUploadForm
          momentTitle={moment.title}
          onClose={() => setShowUploadForm(false)}
          onSubmit={handleAddMedia}
        />
      )}
    </div>
  );
}

export default MediaGallery;
