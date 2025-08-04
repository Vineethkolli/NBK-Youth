import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getSubscription, subscribeToPush } from '../../utils/notifications';

function NotificationPrompt() {
  const { user } = useAuth();
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const promptRef = useRef(null);

  useEffect(() => {
    const checkInstalled = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      ) {
        setIsInstalled(true);
      }
    };

    checkInstalled();
    getSubscription().then(setSubscription);

    let timer;
    const alreadyShown = sessionStorage.getItem('notifPromptShown');
    if (isInstalled && !alreadyShown && Notification.permission !== 'granted') {
      setShowPrompt(true);
      sessionStorage.setItem('notifPromptShown', 'true');
      timer = setTimeout(() => setShowPrompt(false), 4000);
    }

    const handleClickOutside = (event) => {
      if (promptRef.current && !promptRef.current.contains(event.target)) {
        setShowPrompt(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isInstalled]);

  const askPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }
      const sub = await subscribeToPush(user?.registerId);
      setSubscription(sub);
      toast.success('Notifications enabled!');
      setShowPrompt(false);
    } catch (err) {
      toast.error('Failed to subscribe: ' + err.message);
    }
  };

  if (!isInstalled || subscription || !showPrompt || Notification.permission === 'granted') {
    return null;
  }

  return (
    <div
      ref={promptRef}
      className="fixed top-4 left-4 right-4 bg-indigo-50 bg-opacity-80 text-indigo-800 p-4 flex items-center justify-between shadow-lg rounded-lg z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <h3 className="text-lg font-medium flex items-center">
          <Bell className="mr-2" /> Allow Notifications
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={askPermission}
          className="px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 flex items-center transition-colors"
        >
          <Bell className="h-4 w-4 mr-2" /> Allow
        </button>
        <button onClick={() => setShowPrompt(false)}>
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default NotificationPrompt;