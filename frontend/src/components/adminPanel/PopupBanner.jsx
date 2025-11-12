import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, VolumeX, Volume2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function PopupBanner() {
  const [banner, setBanner] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  const fetchActiveBanner = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/banners/active`);
      if (data) {
        setBanner(data);
        setShowBanner(true);
        setShowCount(
          parseInt(localStorage.getItem(`banner_${data._id}_count`) || '0')
        );
      }
    } catch (error) {
      console.error('Failed to fetch active banner:', error);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
    if (banner) {
      const newCount = showCount + 1;
      localStorage.setItem(`banner_${banner._id}_count`, newCount.toString());
      setShowCount(newCount);
    }
  };

  // Auto-close after duration
  useEffect(() => {
    if (banner?.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, banner.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  // Try autoplay with sound first, fallback to muted
  useEffect(() => {
    if (banner?.video && videoRef.current) {
      const video = videoRef.current;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      video.muted = false; // try with sound
      setIsMuted(false);

      video.play().catch(() => {
        // If blocked, fallback to muted autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [banner]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      videoRef.current.muted = newMutedState;
    }
  };

  if (
    !showBanner ||
    !banner ||
    (banner.periodicity && showCount >= banner.periodicity)
  ) {
    return null;
  }

  const renderMessageWithLinks = (text) =>
    text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) =>
      /https?:\/\//.test(part) ? (
        <button
          key={idx}
          onClick={() => window.open(part, '_blank')}
          className="inline-flex items-center px-1 py-0.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
        >
          Open <ExternalLink className="w-4 h-4" />
        </button>
      ) : (
        <span key={idx}>{part}</span>
      )
    );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          {banner.image && (
            <img
              src={banner.image}
              alt={banner.title || 'Banner'}
              className="w-full h-auto rounded-lg mb-4"
            />
          )}

          {banner.video && (
            <div
              className="relative w-full h-auto rounded-lg overflow-hidden mb-4"
              onClick={toggleMute}
            >
              <video
                ref={videoRef}
                src={banner.video}
                className="w-full h-auto"
                muted={isMuted}
                playsInline
                autoPlay
                loop
                controls={false}
              />

              {/* Mute/Unmute Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="absolute bottom-3 right-3 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>
          )}

          {banner.title && (
            <h2 className="text-2xl font-bold mb-4">{banner.title}</h2>
          )}

          {banner.message && (
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {renderMessageWithLinks(banner.message)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PopupBanner;
