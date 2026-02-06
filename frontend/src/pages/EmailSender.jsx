import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import EmailSenderForm from '../components/emailSender/EmailSenderForm';
import EmailScheduleList from '../components/emailSender/EmailScheduleList';
import EmailHistoryList from '../components/emailSender/EmailHistoryList';

function EmailSender() {
  const [scheduled, setScheduled] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchScheduled = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/email-sender/scheduled`);
      setScheduled(data || []);
    } catch (error) {
      console.error('Failed to fetch scheduled emails:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/email-sender/history`);
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
          <h2 className="text-2xl font-semibold text-gray-900">Email Sender</h2>
          <p className="text-sm text-gray-500">
            Send now or schedule emails to users with a 5-second interval.
          </p>
        </div>
      </div>

      <EmailSenderForm onScheduled={handleScheduled} onSent={handleSent} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EmailScheduleList schedules={scheduled} loading={loadingScheduled} />
        <EmailHistoryList history={history} loading={loadingHistory} />
      </div>
    </div>
  );
}

export default EmailSender;
