import { useEffect, useState } from 'react';
import NotificationSettings from '../components/settings/NotificationSettings';
import NotificationForm from '../components/notifications/NotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';
import { API_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import NotificationScheduleList from '../components/notifications/NotificationScheduleList';

function Notifications() {
  const { user, hasAccess } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyType, setHistoryType] = useState('received');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const fetchHistory = async () => {
    if (!user?.registerId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/notifications/history`, {
        params: { registerId: user.registerId, type: historyType },
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
  }, [user, historyType]);

  const handleNewNotification = () => {
    fetchHistory();
  };

  const handleScheduled = () => {
    setEditingSchedule(null);
    setScheduleRefreshKey((value) => value + 1);
  };

  return (
    <div className="max-w-1xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Notifications</h2>
      <NotificationSettings />
      <NotificationForm
        onSuccess={handleNewNotification}
        onScheduled={handleScheduled}
        editingSchedule={editingSchedule}
        onCancelEdit={() => setEditingSchedule(null)}
        canSchedule={hasAccess('Privileged')}
      />
      {hasAccess('Privileged') && (
        <NotificationScheduleList
          key={scheduleRefreshKey}
          onEdit={setEditingSchedule}
        />
      )}
      <NotificationHistory
        history={history}
        loading={loading}
        activeTab={historyType}
        onTabChange={setHistoryType}
      />
    </div>
  );
}

export default Notifications;
