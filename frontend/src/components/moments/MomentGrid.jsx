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

  // YouTube URL Helper
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  // Drive thumbnail helper
  const getDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
  };

  // Drive download helper
  const getDriveDownloadUrl = (url) => {
    if (!url) return '';
    const fileId =
      url.match(/[?&]id=([^&]+)/)?.[1] ||
      url.match(/\/file\/d\/([^/]+)/)?.[1] ||
      url.match(/open\?id=([^&]+)/)?.[1];
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

  // Render previews for "upload" type
  const renderPreviewThumbnails = (moment) => {
    if (moment.type === 'upload' && moment.mediaFiles?.length > 0) {
      const firstFile = moment.mediaFiles[0];
      const remainingCount = moment.mediaFiles.length - 1;

      return (
        <div className="relative w-full h-48 cursor-pointer" onClick={() => setExpandedMoment(moment)}>
          <img
            src={getDriveThumbnailUrl(firstFile.url)}
            alt={firstFile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400/eeeeee/cccccc?text=Error';
            }}
          />

          {/* Fade effect on right 20% */}
          <div className="absolute top-0 right-0 h-full w-1/5 bg-gradient-to-l from-white/90 to-transparent" />

          {/* Arrow button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedMoment(moment);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 
                       p-2 bg-black bg-opacity-70 text-white rounded-full 
                       hover:bg-opacity-90 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* See All overlay bottom-right */}
          {remainingCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedMoment(moment);
              }}
              className="absolute bottom-3 right-2 px-2 py-1 
                         bg-black bg-opacity-70 text-white text-sm font-semibold rounded 
                         hover:bg-opacity-90 transition"
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
  {[...moments]
    .sort((a, b) => {
      // Prefer createdAt if available, fallback to MongoDB ObjectId timestamp
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime();
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime();
      return timeB - timeA; // Newest first
    })
    .map((moment) => (
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
                <div className="relative w-full h-full">
                  <MediaPreview
                    url={moment.url}
                    type={moment.title.match(/\.(jpeg|jpg|gif|png)$/) != null ? 'image' : 'video'}
                    title={moment.title}
                  />
                  <button
                    onClick={() => downloadFile(getDriveDownloadUrl(moment.url), moment.title)}
                    className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition"
                    title="Download media"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                renderPreviewThumbnails(moment)
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

      {/* Lightbox Modal */}
      {lightboxData && (
        <MediaLightbox {...lightboxData} />
      )}
    </>
  );
}

export default MomentGrid;
