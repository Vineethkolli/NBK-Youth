import { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const permission = Notification?.permission;

    const alreadyShown = sessionStorage.getItem('notificationPromptShown');

    if (isInstalled && permission !== 'granted' && !alreadyShown) {
      setShowPrompt(true);
      sessionStorage.setItem('notificationPromptShown', 'true');

      const timer = setTimeout(() => setShowPrompt(false), 4000);
      return () => clearTimeout(timer);
    }

    // Close if clicking outside
    const handleClickOutside = (e) => {
      if (promptRef.current && !promptRef.current.contains(e.target)) {
        setShowPrompt(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAllowNotifications = async () => {
    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === 'granted') {
        toast.success('Notifications enabled');
        setShowPrompt(false);
        window.location.reload(); // Refresh to trigger logic elsewhere
      } else {
        toast.error('Notifications not enabled');
      }
    } catch (err) {
      toast.error('Permission request failed');
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      ref={promptRef}
      className="fixed top-4 left-4 right-4 bg-indigo-50 bg-opacity-90 text-indigo-800 p-4 flex items-center justify-between shadow-lg rounded-lg z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <h3 className="text-lg font-medium">Enable Notifications</h3>
        <p className="text-sm">Stay updated with important alerts.</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAllowNotifications}
          className="px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-600 flex items-center transition-colors duration-200"
        >
          <Bell className="h-4 w-4 mr-2" />
          Allow
        </button>
        <button onClick={() => setShowPrompt(false)}>
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default NotificationPrompt;
