import { Download } from 'lucide-react';

function MediaPreview({ url, type, title }) {
  const getImageUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  const getVideoPlayerUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const getDriveDownloadUrl = (url) => {
    const fileId =
      url.match(/[?&]id=([^&]+)/)?.[1] ||
      url.match(/\/file\/d\/([^/]+)/)?.[1] ||
      url.match(/open\?id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };

  const handleDownload = () => {
    const dl = getDriveDownloadUrl(url);
    const a = document.createElement('a');
    a.href = dl;
    a.download = title || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative w-full h-full aspect-video bg-gray-900 group">
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
        </div>
      )}

      {/* ✅ Small Download button (visible on hover/always mobile) */}
      <button
        onClick={handleDownload}
        className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

export default MediaPreview;
