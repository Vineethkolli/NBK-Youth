// Convert Google Drive sharing URL to direct media URL
export const getDirectMediaUrl = (url) => {
  const fileId = url.match(/id=([^&]+)/)?.[1];
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Convert to video player URL for Drive videos
export const getVideoPlayerUrl = (url) => {
  const fileId = url.match(/id=([^&]+)/)?.[1];
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Get file type from URL or MIME type
export const getMediaType = (url, mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  
  // Fallback to URL analysis
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
  if (url.match(/\.(mp4|webm|ogg)$/i)) return 'video';
  
  return 'unknown';
};