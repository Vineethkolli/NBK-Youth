function DriveMediaPreview({ url, type, title }) {
  // gets the thumbnail URL for images.
  const getImageUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  };

  // iframe player URL for videos
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
        </div>
      )}
    </div>
  );
}

export default DriveMediaPreview;
