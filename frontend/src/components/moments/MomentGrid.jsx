import { useState, useEffect } from 'react';
import { Trash2, Loader2, FolderOpen, RefreshCcw, Edit2, Check, ChevronRight } from 'lucide-react';
import DriveMediaPreview from './DriveMediaPreview.jsx';
import GalleryGrid from '../momentsGallery/GalleryGrid.jsx';
import Lightbox from '../momentsGallery/Lightbox.jsx';

function MomentGrid({
  moments,
  isEditMode,
  onDeleteMoment,
  onDeleteGalleryFile,
  onUpdateMomentTitle,
  onUploadMediaInGallery,
  onCopyToServiceDriveGallery,
  onGalleryOrderSave,
  onSyncDriveFolder,
}) {
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedMoment, setExpandedMoment] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash !== '#lightbox' && lightboxData) setLightboxData(null);
      if (hash !== '#gallery' && hash !== '#lightbox' && expandedMoment) setExpandedMoment(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [expandedMoment, lightboxData]);
  
  useEffect(() => {
    if (expandedMoment) {
      const updatedMoment = moments.find(m => m._id === expandedMoment._id);
      if (updatedMoment) {
        setExpandedMoment(updatedMoment);
      }
    }
  }, [moments, expandedMoment]);

  const openGallery = (moment) => {
    setExpandedMoment(moment);
    window.history.pushState({ view: 'gallery' }, '', '#gallery');
  };

  const openLightbox = (mediaFiles, currentIndex, momentTitle) => {
    setLightboxData({
      mediaFiles,
      currentIndex,
      momentTitle,
      onClose: () => window.history.back(),
    });
    window.history.pushState({ view: 'lightbox' }, '', '#lightbox');
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  const getDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w600` : url;
  };

  // Cancel unsaved edits when edit mode is turned off
useEffect(() => {
  if (!isEditMode && editingTitleId) {
    setEditingTitleId(null);
    setTempTitle('');
  }
}, [isEditMode, editingTitleId]);

  const handleEditTitle = (id, currentTitle) => {
    setEditingTitleId(id);
    setTempTitle(currentTitle);
  };

  const handleSaveTitle = (id) => {
    onUpdateMomentTitle(id, tempTitle);
    setEditingTitleId(null);
  };

  const handleDeleteClick = async (id) => {
    setDeletingId(id);
    await onDeleteMoment(id);
    setTimeout(() => setDeletingId(null), 600);
  };

  const renderPreviewThumbnails = (moment) => {
    if ((moment.type === 'upload' || moment.type === 'drive') && moment.mediaFiles?.length > 0) {
      const firstFile = [...moment.mediaFiles].sort((a, b) => b.order - a.order)[0];
      const remainingCount = moment.mediaFiles.length - 1;
      return (
        <div
          className={`relative w-full h-48 ${!isEditMode ? 'cursor-pointer' : ''}`}
          onClick={() => { if (!isEditMode) openGallery(moment); }}
        >
          <img
            src={getDriveThumbnailUrl(firstFile.url)}
            alt={firstFile.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/eeeeee/cccccc?text=Error'; }}
          />
          <div className="absolute top-0 right-0 h-full w-1/5 bg-gradient-to-l from-white/90 to-transparent" />
          <button
            onClick={(e) => { e.stopPropagation(); if (!isEditMode) openGallery(moment); }}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-black/70  text-white rounded-full hover:bg-opacity-90 transition cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {remainingCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!isEditMode) openGallery(moment); }}
              className="absolute bottom-3 right-2 px-2 py-1 bg-black/70 text-white text-sm font-semibold rounded hover:bg-opacity-90 transition"
            >
              See All (+{remainingCount})
            </button>
          )}
        </div>
      );
    }
    return <div className="flex items-center justify-center h-56 text-gray-400">No media uploaded</div>;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moments.map((moment) => (
          <div key={moment._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="relative w-full h-48">
              {moment.type === 'youtube' ? (
                <iframe
                  src={getEmbedUrl(moment.url)}
                  className="w-full h-full"
                  allow="fullscreen;"
                  title={moment.title}
                />
              ) : moment.type === 'drive' ? (
                moment.mediaFiles && moment.mediaFiles.length > 0 ? (
                  // Drive folder with multiple files → render like media upload
                  renderPreviewThumbnails(moment)
                ) : (
                  // Single file URL → show iframe/image
                  <DriveMediaPreview
                    url={moment.url}
                    type={moment.url && moment.url.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image' : 'video'}
                    title={moment.title}
                  />
                )
              ) : (
                renderPreviewThumbnails(moment)
              )}

              {isEditMode && (
  <div className="absolute top-2 right-2 flex items-center space-x-2">
    {/* Drive Indicator*/}
    {moment.type === 'drive' && (
      <div className="flex items-center bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full mr-2 shadow-sm">
        <FolderOpen className="h-4 w-4 mr-1"/>
        Drive
      </div>
    )}

    {/* Sync button (only for folders) */}
    {moment.type === 'drive' && moment.url.includes('drive.google.com/drive/folders/') && (
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to sync this Drive folder?')) {
            onSyncDriveFolder(moment._id);
          }
        }}
        className="p-1.5 bg-indigo-700 text-white rounded-full hover:bg-indigo-800 transition-colors"
      >
        <RefreshCcw className="h-4 w-4" />
      </button>
    )}

    <button
      onClick={() => handleDeleteClick(moment._id)}
      className={`p-1.5 bg-red-600 text-white rounded-full transition-colors ${
        deletingId === moment._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
      }`}
      disabled={deletingId === moment._id}
    >
      {deletingId === moment._id ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  </div>
)}
            </div>
            <div className="p-2 flex-grow">
              {editingTitleId === moment._id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(moment._id)}
                  />
                  <button
                    onClick={() => handleSaveTitle(moment._id)}
                    className="text-green-600 p-1 hover:bg-green-100 rounded-full"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg mr-2">{moment.title}</h3>
                  {isEditMode && (
                    <button
                      onClick={() => handleEditTitle(moment._id, moment.title)}
                      className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {expandedMoment && (
        <GalleryGrid
          moment={expandedMoment}
          onClose={() => window.history.back()}
          onMediaClick={(mediaFiles, index) => openLightbox(mediaFiles, index, expandedMoment.title)}
          onDeleteGalleryFile={onDeleteGalleryFile}
          onUploadMediaInGallery={onUploadMediaInGallery}
          onCopyToServiceDriveGallery={onCopyToServiceDriveGallery}
          onGalleryOrderSave={onGalleryOrderSave}
        />
      )}

      {lightboxData && <Lightbox {...lightboxData} />}
    </>
  );
}

export default MomentGrid;
