import { useState, useEffect } from 'react';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

function MediaLightbox({ 
  mediaFiles, 
  currentIndex, 
  momentTitle, 
  onClose 
}) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % mediaFiles.length);
  };

  // ✅ High-res image for lightbox
  const getImageUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2048`;
  };

  // ✅ Video iframe preview
  const getVideoPlayerUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  // ✅ Force direct download link
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
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = name || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentMedia = mediaFiles[activeIndex];

  // ✅ Touch swipe handling for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) handleNext();
    else if (isRightSwipe) handlePrevious();
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h3 className="font-medium">{momentTitle}</h3>
            <p className="text-sm text-gray-300">
              {activeIndex + 1} of {mediaFiles.length}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Media Display */}
      <div className="flex-1 flex items-center justify-center relative p-4">
        {currentMedia.type === 'image' ? (
          <img
            src={getImageUrl(currentMedia.url)}
            alt={currentMedia.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x600/000000/ffffff?text=Image+Not+Found'; }}
          />
        ) : (
          <div className="relative w-full h-full max-w-4xl aspect-video">
            <iframe
              src={getVideoPlayerUrl(currentMedia.url)}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              title={currentMedia.name}
            />
          </div>
        )}

        {/* Navigation Arrows */}
        {mediaFiles.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        
        {/* ✅ Fixed Download Button - Bottom Right */}
        <button
          onClick={() => {
            const dl = getDriveDownloadUrl(currentMedia.url);
            downloadFile(dl, currentMedia.name);
          }}
          className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg z-10"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex items-center justify-between">
        <div>
          <p className="font-medium">{currentMedia.name}</p>
        </div>
      </div>
    </div>
  );
}

export default MediaLightbox;
