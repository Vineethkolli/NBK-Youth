import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Download, Trash2, Loader2, Upload, Copy, Edit2, GripHorizontal, CheckCircle, Share2 } from 'lucide-react';
import GalleryReorder from './GalleryReorder';
import MediaUploadForm from './MediaUploadForm';
import CopyToServiceDriveForm from './CopyToServiceDriveForm';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function GalleryGrid({
  moment,
  onClose,
  onMediaClick,
  onDeleteGalleryFile,
  onUploadMediaInGallery,
  onCopyToServiceDriveGallery,
  onGalleryOrderSave,
}) {
  const { hasAccess } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [localMediaFiles, setLocalMediaFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState({});

  const longPressTimeout = useRef(null);
  
  const canManageMedia = hasAccess('Privileged');

  useEffect(() => {
    if (moment && moment.mediaFiles) {
      const sorted = [...moment.mediaFiles].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return b.order - a.order;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setLocalMediaFiles(sorted);
    }
  }, [moment]);

  const getThumbnailUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  const getBackendDownloadUrl = (url) => {
    const fileId =
      url.match(/[?&]id=([^&]+)/)?.[1] ||
      url.match(/\/file\/d\/([^/]+)/)?.[1] ||
      url.match(/open\?id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `${API_URL}/api/moments/download/${fileId}`;
  };

  const downloadFiles = async (files) => {
    if (!files.length) return;
    const toastId = toast.loading('Downloading...');
    try {
      for (const file of files) {
        const backendUrl = getBackendDownloadUrl(file.url);
        const response = await fetch(backendUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      }
      toast.success('Files downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.', { id: toastId });
    }
  };

    const handleShare = async () => { 
    const url = window.location.href;
    const text = `Watch ${moment.title} Moments in NBK Youth APP`;

    if (navigator.share) {
      try {
        await navigator.share({ title: moment.title, text, url });
      } catch (e) {
        console.log("Share cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleAddMedia = async (files) => {
    try {
      await onUploadMediaInGallery(moment._id, files);
      setShowUploadForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddDriveMedia = async (driveUrl) => {
    try {
      await onCopyToServiceDriveGallery(moment._id, driveUrl);
      setShowDriveForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    await onDeleteGalleryFile(moment._id, mediaId);
    setSelectedFiles(selectedFiles.filter((f) => f._id !== mediaId));
    setLocalMediaFiles(localMediaFiles.filter((f) => f._id !== mediaId));
  };

  const bulkDeleteFiles = async () => {
    if (!selectedFiles.length) return;
    const count = selectedFiles.length;
    const confirmMsg = `Are you sure you want to delete ${count} file${count > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    const toastId = toast.loading('Deleting...');
    try {
      for (const f of selectedFiles) {
        await onDeleteGalleryFile(moment._id, f._id);
      }
      setLocalMediaFiles((prev) => prev.filter((p) => !selectedFiles.find((s) => s._id === p._id)));
      setSelectedFiles([]);
      toast.success(`${count} file${count > 1 ? 's' : ''} deleted`, { id: toastId });
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error('Failed to delete files. Try again.', { id: toastId });
    }
  };

  const toggleFileSelect = (file) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f._id === file._id) ? prev.filter((f) => f._id !== file._id) : [...prev, file]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === localMediaFiles.length) setSelectedFiles([]);
    else setSelectedFiles([...localMediaFiles]);
  };

  const handleMediaOrderSave = async (reorderedMedia) => {
    try {
      setLocalMediaFiles(reorderedMedia);
      setIsReorderMode(false);
      await onGalleryOrderSave(moment._id, reorderedMedia);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLongPressStart = (file) => {
    longPressTimeout.current = setTimeout(() => {
      toggleFileSelect(file);
    }, 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimeout.current);
  };

  const isAllSelected = localMediaFiles.length > 0 && selectedFiles.length === localMediaFiles.length;
  const selectionModeActive = selectedFiles.length > 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-gray-800 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </button>

          {selectedFiles.length > 0 ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="flex flex-col items-center justify-center w-10"
                title={isAllSelected ? 'Deselect all' : 'Select all'}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isAllSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-300 bg-black/50 text-white'
                  }`}
                >
                  {isAllSelected && <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="text-xs mt-1">All</span>
              </button>
              <div className="text-xl font-medium">{selectedFiles.length} selected</div>
            </div>
          ) : (
            <h2 className="text-xl font-semibold">{moment.title}</h2>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {selectedFiles.length > 0 ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => downloadFiles(selectedFiles)}
                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                title="Download selected"
              >
                <Download className="h-4 w-4" />
              </button>
              {canManageMedia && (
  <button
    onClick={bulkDeleteFiles}
    className="p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
    title="Delete selected"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}
              <button
                onClick={() => setSelectedFiles([])}
                className="text-red-600 hover:text-red-700 font-semibold"
                title="Cancel selection"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {canManageMedia && (
                <>
                  {moment.type !== 'drive' && (
                    <>
                      <button onClick={() => setShowUploadForm(true)} className="btn-primary">
                        <Upload className="h-4 w-4 mr-2" />
                      </button>
                      <button onClick={() => setShowDriveForm(true)} className="btn-primary">
                        <Copy className="h-4 w-4 mr-2" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsReorderMode(true)}
                    disabled={isReorderMode}
                    className={`btn-secondary ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isReorderMode ? 'Reorder is active' : 'Enter reorder mode'}
                  >
                    <GripHorizontal className="h-4 w-4 mr-2" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(!isEditMode);
                      setIsReorderMode(false);
                    }}
                    className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Done' : ''}
                  </button>
                </>
              )}
              <button
              onClick={handleShare}
              className="text-gray-800 hover:text-gray-900"
              title="Share"
            >
              <Share2 className="h-6 w-6" />
            </button>
              <button onClick={onClose} className="text-gray-800 hover:text-gray-900">
                <X className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {isReorderMode ? (
        <GalleryReorder
          mediaFiles={localMediaFiles}
          onSave={handleMediaOrderSave}
          onCancel={() => setIsReorderMode(false)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {localMediaFiles?.map((file, index) => {
              const isSelected = selectedFiles.find((f) => f._id === file._id);
              return (
                <div key={file._id} className="relative group">
                  <div
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      // if any selection is active, clicking the file toggles selection
                      if (selectionModeActive) {
                        toggleFileSelect(file);
                      } else {
                        onMediaClick(file._id); // pass mediaId to open lightbox
                      }
                    }}
                    onTouchStart={() => handleLongPressStart(file)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleLongPressEnd}
                  >
                    <img
                      src={getThumbnailUrl(file.url)}
                      alt={file.name}
                      className={`w-full h-full object-cover transition-transform ${
                        isSelected ? 'ring-4 ring-indigo-500' : 'group-hover:scale-105'
                      }`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x400/eeeeee/cccccc?text=Error';
                      }}
                    />

                    {/* Selection Circle */}
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-opacity ${
                        // show circle always when selection mode is active or on hover
                        isSelected
                          ? 'opacity-100 bg-indigo-600 border-indigo-500 text-white'
                          : selectionModeActive
                          ? 'opacity-100 border-gray-300 bg-black/50 text-white'
                          : 'opacity-0 group-hover:opacity-100 bg-black/50 text-white'
                      }`}
                      onMouseDown={(e) => e.preventDefault()} // prevent accidental lightbox click
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelect(file);
                      }}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4" />}
                    </div>

                    {file.type === 'video' && (
                      <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/70 rounded-full px-2 py-1">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
                        <span className="text-white text-xs font-medium">Video</span>
                      </div>
                    )}
                  </div>

                  {canManageMedia && isEditMode && (
  <button
    onClick={async (e) => {
      e.stopPropagation();
      if (deletingFiles[file._id]) return; 

      const confirmed = window.confirm('Are you sure you want to delete this media?');
      if (!confirmed) return;

      setDeletingFiles((prev) => ({ ...prev, [file._id]: true }));

      try {
        await handleDeleteMedia(file._id);
      } finally {
        setDeletingFiles((prev) => ({ ...prev, [file._id]: false }));
      }
    }}
    className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
      deletingFiles[file._id] ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
    }`}
    title="Delete"
    disabled={deletingFiles[file._id]}
  >
    {deletingFiles[file._id] ? (
      <Loader2 className="h-4 w-4 animate-spin text-white" />
    ) : (
      <Trash2 className="h-4 w-4 text-white" />
    )}
  </button>
)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canManageMedia && showUploadForm && (
        <MediaUploadForm
          momentId={moment._id}
          momentTitle={moment.title}
          onClose={() => setShowUploadForm(false)}
          onSubmit={handleAddMedia}
        />
      )}

      {canManageMedia && showDriveForm && (
        <CopyToServiceDriveForm
          momentTitle={moment.title}
          onClose={() => setShowDriveForm(false)}
          onSubmit={handleAddDriveMedia}
        />
      )}
    </div>
  );
}

export default GalleryGrid;
