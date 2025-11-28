import { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Loader2, Upload, Copy, Edit2, GripHorizontal, CheckCircle, ArrowLeft, X } from 'lucide-react';
import GalleryReorder from './GalleryReorder';
import MediaUploadForm from './MediaUploadForm';
import CopyToServiceDriveForm from './CopyToServiceDriveForm';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function GalleryGrid({
  moment,
  onDeleteGalleryFile,
  onUploadMediaInGallery,
  onCopyToServiceDriveGallery,
  onGalleryOrderSave,
}) {
  const { hasAccess } = useAuth();
  const navigate = useNavigate();
  const { momentId } = useParams();

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

        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 500);
      }

      toast.success('Files downloaded successfully', { id: toastId });
    } catch (error) {
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

    if (!window.confirm(`Delete ${count} selected file(s)? This action is permanent.`)) return;

    const toastId = toast.loading('Deleting...');

    try {
      for (const f of selectedFiles) {
        await onDeleteGalleryFile(moment._id, f._id);
      }

      setLocalMediaFiles((prev) =>
        prev.filter((file) => !selectedFiles.find((s) => s._id === file._id))
      );
      setSelectedFiles([]);

      toast.success(`${count} file(s) deleted`, { id: toastId });
    } catch (error) {
      toast.error('Failed to delete', { id: toastId });
    }
  };

  const toggleFileSelect = (file) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f._id === file._id)
        ? prev.filter((f) => f._id !== file._id)
        : [...prev, file]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === localMediaFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...localMediaFiles]);
    }
  };

  const handleMediaOrderSave = async (reordered) => {
    try {
      setLocalMediaFiles(reordered);
      setIsReorderMode(false);
      await onGalleryOrderSave(moment._id, reordered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLongPressStart = (file) => {
    longPressTimeout.current = setTimeout(() => toggleFileSelect(file), 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimeout.current);
  };

  const isAllSelected =
    localMediaFiles.length > 0 && selectedFiles.length === localMediaFiles.length;

  const selectionModeActive = selectedFiles.length > 0;

  return (
    <div>
      <div className="bg-white p-3 flex items-center justify-between border-b">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/moments')}
            className="flex items-center text-gray-900 hover:text-black"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          {selectionModeActive ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="flex flex-col items-center justify-center w-10"
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isAllSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-gray-300 bg-black/50 text-white'
                  }`}
                >
                  {isAllSelected && <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="text-xs mt-1">All</span>
              </button>

              <span className="text-xl font-medium">{selectedFiles.length} selected</span>
            </div>
          ) : (
            <h2 className="text-xl font-semibold">{moment.title}</h2>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {selectionModeActive ? (
            <>
              <button
                onClick={() => downloadFiles(selectedFiles)}
                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
              </button>

              {canManageMedia && (
                <button
                  onClick={bulkDeleteFiles}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setSelectedFiles([])}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {canManageMedia && moment.type !== 'drive' && (
                <>
                  <button onClick={() => setShowUploadForm(true)} className="btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                  </button>

                  <button onClick={() => setShowDriveForm(true)} className="btn-primary">
                    <Copy className="h-4 w-4 mr-2" />
                  </button>
                </>
              )}

              {canManageMedia && (
                <>
                  <button
                    onClick={() => setIsReorderMode(true)}
                    disabled={isReorderMode}
                    className={`btn-secondary ${
                      isReorderMode ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
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

                  <button
            onClick={() => navigate('/moments')}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-700"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
                </>
              )}
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
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {localMediaFiles?.map((file, index) => {
              const isSelected = selectedFiles.find((f) => f._id === file._id);

              return (
                <div key={file._id} className="relative group">

                  <div
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      if (selectionModeActive) toggleFileSelect(file);
                      else navigate(`/moments/${momentId}/${index}`);
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
                        e.target.src =
                          'https://placehold.co/400x400/eeeeee/cccccc?text=Error';
                      }}
                    />

                    {/* Selection icon */}
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-opacity ${
                        isSelected
                          ? 'opacity-100 bg-indigo-600 border-indigo-500 text-white'
                          : selectionModeActive
                          ? 'opacity-100 border-gray-300 bg-black/50 text-white'
                          : 'opacity-0 group-hover:opacity-100 bg-black/50 text-white'
                      }`}
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

                        const confirmed = window.confirm('Delete this media?');
                        if (!confirmed) return;

                        setDeletingFiles((prev) => ({ ...prev, [file._id]: true }));

                        try {
                          await handleDeleteMedia(file._id);
                        } finally {
                          setDeletingFiles((prev) => ({ ...prev, [file._id]: false }));
                        }
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                        deletingFiles[file._id]
                          ? 'bg-red-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
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

      {/* Upload Forms */}
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
