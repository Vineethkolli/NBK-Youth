import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Download, Trash2, Loader2, Upload, Copy, Edit2, GripHorizontal, CheckCircle } from 'lucide-react';
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
    // FIX START: Changed wrapper to be a flex container with padding (handling safe areas naturally)
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-2">
      
      {/* FIX START: Inner container acts as the 'Modal' - limiting width and height prevents edge swallowing */}
      <div className="bg-white w-full max-w-7xl h-full max-h-[99vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header Section */}
        <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-4">
            {/* Added functionality: Clicking Back here closes the modal */}
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800 ">
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
                      isAllSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-300 bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isAllSelected && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] mt-1 text-gray-500 font-medium">All</span>
                </button>
                <div className="text-lg font-medium">{selectedFiles.length} selected</div>
              </div>
            ) : (
              <h2 className="text-xl font-semibold truncate max-w-[200px] sm:max-w-md">{moment.title}</h2>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {selectedFiles.length > 0 ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => downloadFiles(selectedFiles)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                  title="Download selected"
                >
                  <Download className="h-4 w-4" />
                </button>
                {canManageMedia && (
                  <button
                    onClick={bulkDeleteFiles}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center shadow-sm"
                    title="Delete selected"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm px-2"
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
                      <div className="flex space-x-2">
                        <button onClick={() => setShowUploadForm(true)} className="p-2 hover:bg-gray-100 rounded-full text-indigo-600" title="Upload">
                          <Upload className="h-5 w-5" />
                        </button>
                        <button onClick={() => setShowDriveForm(true)} className="p-2 hover:bg-gray-100 rounded-full text-blue-600" title="Import from Drive">
                          <Copy className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setIsReorderMode(true)}
                      disabled={isReorderMode}
                      className={`p-2 hover:bg-gray-100 rounded-full text-gray-600 ${isReorderMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isReorderMode ? 'Reorder is active' : 'Reorder'}
                    >
                      <GripHorizontal className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(!isEditMode);
                        setIsReorderMode(false);
                      }}
                      className={`p-2 rounded-full transition-colors ${isEditMode ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Edit Mode"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </>
                )}
                {/* Desktop close button */}
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area - This scrolls independently within the modal */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
          {isReorderMode ? (
            <GalleryReorder
              mediaFiles={localMediaFiles}
              onSave={handleMediaOrderSave}
              onCancel={() => setIsReorderMode(false)}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
              {localMediaFiles?.map((file, index) => {
                const isSelected = selectedFiles.find((f) => f._id === file._id);
                return (
                  <div key={file._id} className="relative group aspect-square">
                    <div
                      className="w-full h-full bg-gray-200 rounded-xl overflow-hidden cursor-pointer shadow-sm relative"
                      onClick={() => {
                        if (selectionModeActive) {
                          toggleFileSelect(file);
                        } else {
                          onMediaClick(localMediaFiles, index);
                        }
                      }}
                      onTouchStart={() => handleLongPressStart(file)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                    >
                      <img
                        src={getThumbnailUrl(file.url)}
                        alt={file.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSelected ? 'scale-95' : 'group-hover:scale-110'
                        }`}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400/eeeeee/cccccc?text=Error';
                        }}
                      />

                      {/* Selection Overlay */}
                      {(isSelected || selectionModeActive) && (
                        <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-indigo-900/20' : ''}`} />
                      )}

                      {/* Selection Checkbox */}
                      <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all duration-200 z-10 ${
                          isSelected
                            ? 'opacity-100 bg-indigo-600 border-indigo-500 text-white scale-100'
                            : selectionModeActive
                            ? 'opacity-100 border-gray-300 bg-black/40 text-white scale-100'
                            : 'opacity-0 group-hover:opacity-100 bg-black/40 text-white scale-90'
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelect(file);
                        }}
                      >
                        {isSelected && <CheckCircle className="h-4 w-4" />}
                      </div>

                      {file.type === 'video' && (
                        <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 z-10">
                          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
                          <span className="text-white text-[10px] font-medium tracking-wide">Video</span>
                        </div>
                      )}
                    </div>

                    {/* Delete Button (Edit Mode) */}
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
                        className={`absolute -top-2 -right-2 p-2 rounded-full shadow-md transition-all z-20 ${
                          deletingFiles[file._id] ? 'bg-red-400 cursor-not-allowed' : 'bg-white text-red-600 hover:bg-red-50 hover:scale-110'
                        }`}
                        title="Delete"
                        disabled={deletingFiles[file._id]}
                      >
                        {deletingFiles[file._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
