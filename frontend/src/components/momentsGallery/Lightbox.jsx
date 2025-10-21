import { useState, useEffect } from 'react';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function Lightbox({ mediaFiles, currentIndex, momentTitle, onClose }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (activeIndex > 0) handlePrevious();
          break;
        case 'ArrowRight':
          if (activeIndex < mediaFiles.length - 1) handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handlePrevious = () => setActiveIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setActiveIndex((prev) => Math.min(prev + 1, mediaFiles.length - 1));

  const extractFileId = (url) => {
    return (
      url.match(/[?&]id=([^&]+)/)?.[1] ||
      url.match(/\/file\/d\/([^\/]+)/)?.[1] ||
      url.match(/open\?id=([^&]+)/)?.[1] ||
      null
    );
  };

  const getImageUrl = (url) => {
    const fileId = extractFileId(url);
    if (!fileId) return url;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2048`;
  };

  const getVideoPlayerUrl = (url) => {
    const fileId = extractFileId(url);
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const getBackendDownloadUrl = (url) => {
    const fileId = extractFileId(url);
    if (!fileId) return url;
    return `${API_URL}/api/moments/download/${fileId}`;
  };

  // ✅ Download with loading toast
  const handleDownload = async (url, filename) => {
    const backendUrl = getBackendDownloadUrl(url);
    const toastId = toast.loading('Downloading...');

    try {
      const response = await fetch(backendUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke blob URL after short delay
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);

      toast.success('File downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.', { id: toastId });
    }
  };

  const currentMedia = mediaFiles[activeIndex];

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && activeIndex < mediaFiles.length - 1) handleNext();
    if (distance < -50 && activeIndex > 0) handlePrevious();
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-black/75 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h3 className="font-medium">{momentTitle}</h3>
            <p className="text-sm text-gray-300">
              {activeIndex + 1} of {mediaFiles.length}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Media Display */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {currentMedia.type === 'image' ? (
          <img
            src={getImageUrl(currentMedia.url)}
            alt={currentMedia.name}
            className="max-w-[95%] max-h-[95%] object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://placehold.co/800x600/000000/ffffff?text=Image+Not+Found';
            }}
          />
        ) : (
          <div className="relative w-full h-full max-w-4xl p-2 aspect-video">
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
              disabled={activeIndex === 0}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full transition-opacity ${
                activeIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-opacity-75'
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === mediaFiles.length - 1}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full transition-opacity ${
                activeIndex === mediaFiles.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-opacity-75'
              }`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Download Button */}
        <button
          onClick={() => handleDownload(currentMedia.url, currentMedia.name)}
          className="fixed bottom-4 right-5 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg z-10"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Footer */}
      <div className="bg-black/75 text-white p-4 flex items-center justify-between">
        <div>
          <p className="font-medium notranslate">{currentMedia.name}</p>
        </div>
      </div>
    </div>
  );
}

export default Lightbox;
