import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) return null;

  return (
    <div
      className={`fixed top-2 right-2 z-50 flex items-center gap-2 px-3  py-2 rounded-lg shadow-lg ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">No internet connection</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
