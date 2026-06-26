import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import { urlBase64ToUint8Array } from '../../utils/vapidKeys';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function NotificationPrompt() {
  const { user } = useAuth();
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const promptRef = useRef(null);

  useEffect(() => {
    const checkInstalled = () => {
      try {
        const isStandalone =
          window.matchMedia?.('(display-mode: standalone)').matches ||
          window.navigator.standalone === true;
        setIsInstalled(isStandalone);
      } catch (err) {
        console.warn('Install detection failed:', err);
        setIsInstalled(false);
      }
    };

    checkInstalled();
    getSubscriptionSafe();

    let timer;
    const alreadyShown = sessionStorage.getItem('notifPromptShown');
    if (
      isInstalled &&
      !alreadyShown &&
      'Notification' in window &&
      Notification.permission !== 'granted'
    ) {
      setShowPrompt(true);
      sessionStorage.setItem('notifPromptShown', 'true');
      timer = setTimeout(() => setShowPrompt(false), 5000);
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

  const getSubscriptionSafe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setSubscription(existing);
    } catch (error) {
      console.error('Error getting subscription:', error);
    }
  };

  const askPermission = async () => {
    if (!('Notification' in window) || !('PushManager' in window)) {
      toast.error('Notifications not supported on this device');
      return;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      if (!('serviceWorker' in navigator)) {
        toast.error('Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const res = await axios.get(`${API_URL}/api/notifications/publicKey`);
      const publicVapidKey = res.data.publicKey;
      const converted = urlBase64ToUint8Array(publicVapidKey);

      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: converted,
      });

      await axios.post(`${API_URL}/api/notifications/subscribe`, {
        registerId: user?.registerId,
        subscription: newSub,
      });

      toast.success('Notifications enabled!');
      setSubscription(newSub);
      setShowPrompt(false);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe to notifications');
    }
  };

  if (
    !isInstalled ||
    subscription ||
    !showPrompt ||
    Notification.permission === 'granted'
  ) {
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
          <Bell className="mr-2" /> Notifications
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={askPermission}
          className="px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 flex items-center transition-colors"
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
