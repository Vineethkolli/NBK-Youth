import { useState } from 'react';
import { ArrowLeft, X, Download, MoreVertical, Trash2 } from 'lucide-react';

function MediaGallery({ 
  moment, 
  isEditMode, 
  onClose, 
  onMediaClick, 
  onDeleteMedia,
  showMediaOptions,
  setShowMediaOptions 
}) {
  // CORRECTED: This function now reliably gets embeddable thumbnails for both images and videos.
  const getThumbnailUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    // Use the reliable Google Drive thumbnail endpoint. &sz=w1000 requests a larger size.
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  const getDriveDownloadUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1] || url.match(/\/file\/d\/([^\/]+)/)?.[1] || url.match(/open\?id=([^&]+)/)?.[1];
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
      // Fallback to opening in new tab
      window.open(downloadUrl, '_blank', 'noopener');
    }
  };

  const handleMediaOptions = (mediaId) => {
    setShowMediaOptions(showMediaOptions === mediaId ? null : mediaId);
  };

  const handleDeleteMedia = async (mediaId) => {
    // Replaced window.confirm with a simple confirmation for compatibility.
    if (confirm('Are you sure you want to delete this media?')) {
      await onDeleteMedia(moment._id, mediaId);
      setShowMediaOptions(null);
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
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {moment.mediaFiles?.map((file, index) => (
            <div key={file._id} className="relative group">
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => onMediaClick(moment.mediaFiles, index)}
              >
                {/* UNIFIED RENDER: Both image and video types now use an <img> tag 
                    with the reliable thumbnail URL. This ensures all media has a visible preview.
                    The full video will be played in the lightbox. */}
                <img
                  src={getThumbnailUrl(file.url)}
                  alt={file.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  // Add a fallback for broken images
                  onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/eeeeee/cccccc?text=Error'; }}
                />
              </div>

              {/* Download Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const dl = getDriveDownloadUrl(file.url);
                  downloadFile(dl, file.name);
                }}
                className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MediaGallery;
