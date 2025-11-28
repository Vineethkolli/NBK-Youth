import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ArrowLeft, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import { useNavigate } from 'react-router-dom';

function Lightbox({ mediaFiles, currentIndex, momentTitle, momentId }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

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
          navigate(`/moments/${momentId}`);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, mediaFiles.length, navigate, momentId]);

  const handlePrevious = () => {
    const newIndex = Math.max(activeIndex - 1, 0);
    setActiveIndex(newIndex);
    navigate(`/moments/${momentId}/${newIndex}`, { replace: true });
  };

  const handleNext = () => {
    const newIndex = Math.min(activeIndex + 1, mediaFiles.length - 1);
    setActiveIndex(newIndex);
    navigate(`/moments/${momentId}/${newIndex}`, { replace: true });
  };

  const extractFileId = (url) => {
    return (
      url.match(/[?&]id=([^&]+)/)?.[1] ||
      url.match(/\/file\/d\/([^/]+)/)?.[1] ||
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

      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      toast.success('File downloaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Download failed', { id: toastId });
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
    className="fixed inset-0 bg-black z-[9999] flex flex-col"
    style={{
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* HEADER */}
    <div className="bg-black/80 text-white px-4 py-3 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(`/moments/${momentId}`)}
          className="text-white hover:text-gray-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div>
          <h3 className="font-medium text-base">{momentTitle}</h3>
          <p className="text-xs text-gray-300">
            {activeIndex + 1} of {mediaFiles.length}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => handleDownload(currentMedia.url, currentMedia.name)}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>

        <button
          onClick={() => navigate(`/moments/${momentId}`)}
          className="p-2 hover:bg-gray-200 rounded-full text-white hover:text-gray-300"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>

    {/* FULLSCREEN MEDIA */}
    <div className="flex-1 relative flex items-center justify-center overflow-hidden touch-none">
      {currentMedia.type === "image" ? (
        <img
          src={getImageUrl(currentMedia.url)}
          className="w-full h-full object-contain"
          alt=""
        />
      ) : (
        <iframe
          src={getVideoPlayerUrl(currentMedia.url)}
          className="w-full h-full object-contain border-0"
          allow="autoplay; fullscreen"
          title="video"
        />
      )}

      {/* ARROWS */}
      {mediaFiles.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={activeIndex === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full ${
              activeIndex === 0 ? "opacity-30" : "hover:bg-black/70"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            disabled={activeIndex === mediaFiles.length - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full ${
              activeIndex === mediaFiles.length - 1
                ? "opacity-30"
                : "hover:bg-black/70"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  </div>
);

}

export default Lightbox;
