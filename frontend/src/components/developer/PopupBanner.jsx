import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function PopupBanner() {
  const [banner, setBanner] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showCount, setShowCount] = useState(0);

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

  useEffect(() => {
    if (banner?.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, banner.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  if (
    !showBanner ||
    !banner ||
    (banner.periodicity && showCount >= banner.periodicity)
  ) {
    return null;
  }

  // Render message text, replacing URLs with an "Open" button
  const renderMessageWithLinks = (text) =>
    text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) =>
      /https?:\/\//.test(part) ? (
        <button
          key={idx}
          onClick={() => window.open(part, '_blank')}
          className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          Open <ExternalLink className="w-4 h-4" />
        </button>
      ) : (
        <span key={idx}>{part}</span>
      )
    );

  return (
    // Overlay catches outside clicks
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      {/* Content stops propagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
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
            <video
              src={banner.video}
              controls
              autoPlay
              className="w-full h-auto rounded-lg mb-4"
            />
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
