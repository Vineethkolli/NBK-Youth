import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Send, Check, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { getSocket } from '../utils/socket';
import { showNotification, subscribeToPushNotifications } from '../utils/notifications';
import NotificationHistory from '../components/notification/NotificationHistory';

function Notifier() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    target: 'all',
    registerId: ''
  });

  useEffect(() => {
    fetchNotifications();
    setupNotifications();
  }, [user]);

  const setupNotifications = async () => {
    if (Notification.permission === 'default') {
      try {
        await subscribeToPushNotifications();
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    }

    const socket = getSocket();
    if (socket && user) {
      socket.on('newNotification', handleNewNotification);
    }

    return () => {
      if (socket) {
        socket.off('newNotification');
      }
    };
  };

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    showNotification(
      notification.title,
      notification.body,
      {
        url: '/notifier',
        notificationId: notification._id
      }
    );
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: notification.title,
        body: notification.body,
        target: notification.target,
        ...(notification.target === 'registerId' && { registerId: notification.registerId })
      };

      await axios.post(`${API_URL}/api/notifications/send`, payload);
      toast.success('Notification sent successfully');
      setNotification({ title: '', body: '', target: 'all', registerId: '' });
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {user?.role === 'developer' && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Bell className="mr-2" /> Send Notifications
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={notification.body}
                onChange={(e) => setNotification({ ...notification, body: e.target.value })}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Send To</label>
              <select
                value={notification.target}
                onChange={(e) => setNotification({ ...notification, target: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="registerId">Specific Register ID</option>
                <option value="allUsers">All Regular Users</option>
                <option value="allDevelopers">All Developers</option>
                <option value="allAdmins">All Admins</option>
                <option value="allFinanciers">All Financiers</option>
              </select>
            </div>

            {notification.target === 'registerId' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Register ID</label>
                <input
                  type="text"
                  value={notification.registerId}
                  onChange={(e) => setNotification({ ...notification, registerId: e.target.value })}
                  required
                  placeholder="Enter Register ID (e.g., R1)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="mr-2 h-4 w-4" /> Send Notification
            </button>
          </form>
        </div>
      )}

      <NotificationHistory notifications={notifications} />
    </div>
  );
}

export default Notifier;