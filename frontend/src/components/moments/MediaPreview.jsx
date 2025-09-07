import { Download, Play } from 'lucide-react';

function MediaPreview({ url, type, title }) {
  // CORRECTED: This function now gets the reliable thumbnail URL for images.
  const getImageUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  // This function creates the iframe player URL for videos, which is the correct approach.
  const getVideoPlayerUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  return (
    <div className="relative w-full h-full aspect-video bg-gray-900">
      {type === 'image' ? (
        <img
          src={getImageUrl(url)}
          alt={title || 'Image'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x225/eeeeee/cccccc?text=Error'; }}
        />
      ) : (
        <div className="relative w-full h-full">
          <iframe
            src={getVideoPlayerUrl(url)}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay"
            title={title || 'Video'}
          />
          {/* Video Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaPreview;
