
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import MailerForm from '../components/mailer/MailerForm';
import MailerScheduleList from '../components/mailer/MailerScheduleList';
import MailerHistoryList from '../components/mailer/MailerHistoryList';
import MailerEmailDialog from '../components/mailer/MailerEmailDialog';

function Mailer() {
  const [scheduled, setScheduled] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleEditMode, setScheduleEditMode] = useState(false);

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
    setScheduled((prev) => editingSchedule
      ? [schedule, ...prev.filter((item) => item._id !== editingSchedule._id)]
      : [schedule, ...prev]);
    setEditingSchedule(null);
  };

  const handleDeleteScheduled = (id) => {
    setScheduled((prev) => prev.filter((schedule) => schedule._id !== id));
    if (editingSchedule?._id === id) {
      setEditingSchedule(null);
    }
  };

  const handleSent = (historyEntry) => {
    setHistory((prev) => [historyEntry, ...prev]);
  };

  return (
    <div className="w-full max-w-6xl min-w-0 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Mailer</h2>
        </div>
      </div>

      <MailerForm
        onScheduled={handleScheduled}
        onSent={handleSent}
        editingSchedule={editingSchedule}
        onCancelEdit={() => setEditingSchedule(null)}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <MailerScheduleList
          schedules={scheduled}
          loading={loadingScheduled}
          onView={setSelectedEmail}
          onEdit={setEditingSchedule}
          onDelete={handleDeleteScheduled}
          editMode={scheduleEditMode}
          onToggleEditMode={() => {
            setScheduleEditMode((previous) => !previous);
            setEditingSchedule(null);
          }}
        />

        <MailerHistoryList
          history={history}
          loading={loadingHistory}
          onView={setSelectedEmail}
        />
      </div>

      <MailerEmailDialog
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  );
}

export default Mailer;
