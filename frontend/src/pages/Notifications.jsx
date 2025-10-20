import { useEffect, useState } from 'react';
import NotificationSettings from '../components/settings/NotificationSettings';
import NotificationForm from '../components/notifications/NotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';
import { API_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Notifications() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user?.registerId) return;
    try {
      const response = await axios.get(`${API_URL}/api/notifications/history`, {
        params: { registerId: user.registerId },
      });
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch notification history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleNewNotification = (notificationData) => {
    const newEntry = {
      _id: Math.random().toString(36).slice(2),
      title: notificationData.title,
      body: notificationData.body,
      target: notificationData.target,
      sentBy: user?.registerId || 'System',
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="max-w-1xl mx-auto space-y-6">
      <NotificationSettings />
      <NotificationForm onSuccess={handleNewNotification} />
      <NotificationHistory history={history} loading={loading} />
    </div>
  );
}

export default Notifications;
