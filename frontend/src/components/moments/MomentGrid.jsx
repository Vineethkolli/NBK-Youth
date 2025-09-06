import { useState } from 'react';
import { Trash2, Pin, Edit2, Check, Download, ChevronRight } from 'lucide-react';
import MediaPreview from './MediaPreview.jsx';
import MediaGallery from './MediaGallery.jsx';
import MediaLightbox from './MediaLightbox.jsx';

function MomentGrid({ 
  moments, 
  isEditMode, 
  onDelete, 
  onDeleteMediaFile,
  onTogglePin, 
  onUpdateTitle 
}) {
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedMoment, setExpandedMoment] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [showMediaOptions, setShowMediaOptions] = useState(null);

  // YouTube URL Helper
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  // CORRECTED: Unified function to get reliable embeddable thumbnails for Drive files.
  const getDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`; // Medium size thumbnail for grid
  };

  // NEW: Function to get a direct download URL for Drive files.
  const getDriveDownloadUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1] || url.match(/\/file\/d\/([^\/]+)/)?.[1] || url.match(/open\?id=([^&]+)/)?.[1];
    if (!fileId) return url; // Fallback
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
  
  const handleEditTitle = (id, currentTitle) => {
    setEditingTitleId(id);
    setTempTitle(currentTitle);
  };

  const handleSaveTitle = (id) => {
    onUpdateTitle(id, tempTitle);
    setEditingTitleId(null);
  };

  const handleDeleteClick = async (id) => {
    setDeletingId(id);
    await onDelete(id);
    setTimeout(() => setDeletingId(null), 600);
  };

  const openLightbox = (mediaFiles, currentIndex, momentTitle) => {
    setLightboxData({
      mediaFiles,
      currentIndex,
      momentTitle,
      onClose: () => setLightboxData(null),
    });
  };

  // This function renders the small previews for "upload" type moments
  const renderPreviewThumbnails = (moment) => {
    if (moment.type === 'upload' && moment.mediaFiles?.length > 0) {
      const previewFiles = moment.mediaFiles.slice(0, 3);
      const remainingCount = moment.mediaFiles.length - 3;

      return (
        <div className="flex space-x-2 items-center" onClick={() => setExpandedMoment(moment)}>
          {previewFiles.map((file) => (
            <div key={file._id} className="relative w-16 h-16 rounded overflow-hidden shadow-sm">
              {/* RENDER FIX: Using <img> with the reliable thumbnail URL for both images and videos */}
              <img
                src={getDriveThumbnailUrl(file.url)}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/eeeeee/cccccc?text=Error'; }}
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="flex items-center text-gray-500">
              <span className="text-sm">+{remainingCount} more</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          )}
          {moment.mediaFiles.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedMoment(moment);
              }}
              className="flex items-center text-indigo-600 hover:text-indigo-800 ml-2"
            >
              <span className="text-sm font-semibold">See All</span>
            </button>
          )}
        </div>
      );
    }
    return <div className="text-gray-400">No media uploaded</div>;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moments.map((moment) => (
          <div key={moment._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="relative">
              {moment.type === 'youtube' ? (
                <iframe
                  src={getEmbedUrl(moment.url)}
                  className="w-full aspect-video"
                  allow="fullscreen;"
                  title={moment.title}
                />
              ) : moment.type === 'drive' ? (
                <div className="relative w-full h-full">
                  <MediaPreview
                    url={moment.url}
                    type={moment.title.match(/\.(jpeg|jpg|gif|png)$/) != null ? 'image' : 'video'}
                    title={moment.title}
                  />
                  <button
                    onClick={() => downloadFile(getDriveDownloadUrl(moment.url), moment.title)}
                    className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
                    title="Download media"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gray-100 flex items-center justify-center p-4 cursor-pointer" onClick={() => setExpandedMoment(moment)}>
                  {renderPreviewThumbnails(moment)}
                </div>
              )}

              {isEditMode && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => onTogglePin(moment._id)}
                    className={`p-1.5 rounded-full ${moment.isPinned ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-black bg-opacity-40 hover:bg-opacity-60'} text-white transition-colors`}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(moment._id)}
                    className={`p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors ${deletingId === moment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={deletingId === moment._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 flex-grow">
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

      {/* Expanded Gallery Modal */}
      {expandedMoment && (
        <MediaGallery
          moment={expandedMoment}
          isEditMode={isEditMode}
          onClose={() => setExpandedMoment(null)}
          onMediaClick={(mediaFiles, index) => openLightbox(mediaFiles, index, expandedMoment.title)}
          onDeleteMedia={onDeleteMediaFile}
          showMediaOptions={showMediaOptions}
          setShowMediaOptions={setShowMediaOptions}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxData && (
        <MediaLightbox {...lightboxData} />
      )}
    </>
  );
}

export default MomentGrid;

