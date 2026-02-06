import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import MailerForm from '../components/mailer/MailerForm';
import MailerScheduleList from '../components/mailer/MailerScheduleList';
import MailerHistoryList from '../components/mailer/MailerHistoryList';

function Mailer() {
  const [scheduled, setScheduled] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchScheduled = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/mailer/scheduled`);
      setScheduled(data || []);
    } catch (error) {
      console.error('Failed to fetch scheduled emails:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/mailer/history`);
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch email history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
    fetchHistory();
  }, []);

  const handleScheduled = (schedule) => {
    setScheduled((prev) => [schedule, ...prev]);
  };

  const handleSent = (historyEntry) => {
    setHistory((prev) => [historyEntry, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Mailer</h2>
        </div>
      </div>

      <MailerForm onScheduled={handleScheduled} onSent={handleSent} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MailerScheduleList schedules={scheduled} loading={loadingScheduled} />
        <MailerHistoryList history={history} loading={loadingHistory} />
      </div>
    </div>
  );
}

export default Mailer;
