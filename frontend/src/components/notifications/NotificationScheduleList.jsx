import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarClock, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import { formatDateTime } from '../../utils/dateTime';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700'
};

function NotificationScheduleList({ onEdit }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchSchedules = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications/scheduled`);
      setSchedules(data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch scheduled notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const deleteSchedule = async (schedule) => {
    if (!window.confirm('Delete this scheduled notification?')) return;
    try {
      await axios.delete(`${API_URL}/api/notifications/scheduled/${schedule._id}`);
      setSchedules((previous) => previous.filter((item) => item._id !== schedule._id));
      toast.success('Scheduled notification deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete scheduled notification');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h3>
          <p className="text-xs text-gray-500">Notifications will be sent at their scheduled time (IST)</p>
        </div>
        <button type="button" onClick={() => setEditMode((value) => !value)} className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100">
          <Pencil className="h-4 w-4" /> {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
      {loading ? <div className="text-sm text-gray-500">Loading...</div> : schedules.length === 0 ? <div className="text-sm text-gray-500">No scheduled notifications.</div> : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold break-words">{schedule.title}</h4>
                <div className="flex items-center gap-1">
                  {editMode && <button type="button" onClick={() => onEdit(schedule)} className="rounded-md p-2 text-gray-400 hover:text-indigo-600" title={schedule.status === 'pending' ? 'Edit' : 'Reschedule'}>
                    {schedule.status === 'pending' ? <Pencil className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                  </button>}
                  {editMode && <button type="button" onClick={() => deleteSchedule(schedule)} className="rounded-md p-2 text-gray-400 hover:text-rose-600" title="Delete"><Trash2 className="h-5 w-5" /></button>}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[schedule.status] || 'bg-gray-100 text-gray-600'}`}>{schedule.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 break-words">{schedule.message}</p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                <span>Send Date: {formatDateTime(schedule.scheduledAt)}</span>
                <span>Target: {schedule.target}</span>
                <span>Recipients: {schedule.totalRecipients}</span>
                <span>Register Id: {schedule.recipients}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationScheduleList;
