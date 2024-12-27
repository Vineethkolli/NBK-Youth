import { Download } from 'lucide-react';

function MediaPreview({ url, type, title, downloadUrl }) {
  // Convert Google Drive view URL to direct media URL
  const getDirectMediaUrl = (url) => {
    const fileId = url.match(/id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  // Convert to video player URL for Drive videos
  const getVideoPlayerUrl = (url) => {
    const fileId = url.match(/id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  return (
    <div className="relative">
      {type === 'image' ? (
        <img
          src={getDirectMediaUrl(url)}
          alt={title || 'Image'}
          className="w-full aspect-video object-cover rounded-t-lg"
          loading="lazy"
        />
      ) : (
        <iframe
          src={getVideoPlayerUrl(url)}
          className="w-full aspect-video rounded-t-lg"
          allowFullScreen
          allow="autoplay"
          title={title || 'Video'}
        />
      )}
      
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
          title="Download media"
        >
          <Download className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}

export default MediaPreview;