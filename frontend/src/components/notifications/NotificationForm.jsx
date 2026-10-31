import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const targetOptions = [
  { value: 'All', label: 'All Users' },
  { value: 'Youth_Villager_Category', label: 'Youth & Villagers' },
  { value: 'Youth_Category', label: 'Youth' },
  { value: 'Admins_Financiers_Developers', label: 'Admins, Financiers & Developers' },
  { value: 'Specific User', label: 'Specific User' }
];

const toIstInput = (value) => {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

function NotificationForm({
  onSuccess,
  onScheduled,
  editingSchedule,
  onCancelEdit,
  canSchedule = false
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [target, setTarget] = useState('All');
  const [registerId, setRegisterId] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingSchedule) return;
    setTitle(editingSchedule.title || '');
    setBody(editingSchedule.message || '');
    setLink(editingSchedule.link || '');
    setTarget(editingSchedule.target || 'All');
    setRegisterId(editingSchedule.registerId || '');
    setScheduledAt(toIstInput(editingSchedule.scheduledAt));
    setScheduleMode(true);
  }, [editingSchedule]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setLink('');
    setTarget('All');
    setRegisterId('');
    setScheduledAt('');
    setScheduleMode(false);
  };

  const validate = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Notification title and message are required');
      return false;
    }
    if (target === 'Specific User' && !registerId.trim()) {
      toast.error('Register ID is required');
      return false;
    }
    if (scheduleMode && !scheduledAt) {
      toast.error('Schedule date and time is required');
      return false;
    }
    return true;
  };

  const sendNow = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/notifications/notify`, {
        title: title.trim(),
        body: body.trim(),
        link: link.trim(),
        target,
        registerId: target === 'Specific User' ? registerId.trim() : undefined
      });
      toast.success(data?.message || 'Notification send started');
      onSuccess?.();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start notification send');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSchedule = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: body.trim(),
        link: link.trim(),
        target,
        registerId: target === 'Specific User' ? registerId.trim() : undefined,
        scheduledAt
      };
      const isPending = editingSchedule?.status === 'pending';
      const endpoint = editingSchedule
        ? `${API_URL}/api/notifications/scheduled/${editingSchedule._id}${isPending ? '' : '/reschedule'}`
        : `${API_URL}/api/notifications/scheduled`;
      const method = editingSchedule && !isPending ? 'post' : editingSchedule ? 'put' : 'post';
      const { data } = await axios[method](endpoint, payload);
      toast.success(data?.message || 'Notification scheduled');
      onScheduled?.(data.schedule);
      resetForm();
      onCancelEdit?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to schedule notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSchedulePicker = () => {
    setScheduleMode(false);
    setScheduledAt('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {editingSchedule
          ? (editingSchedule.status === 'pending'
            ? 'Edit Scheduled Notification'
            : 'Reschedule Notification')
          : 'Compose Notification'}
      </h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Message *</label>
          <textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write notification message"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Link</label>
          <input
            type="text"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Ex: /vibe or https://example.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Send To</label>
          <select
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              setRegisterId('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {target === 'Specific User' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Register ID</label>
            <input
              type="text"
              value={registerId}
              onChange={(event) => setRegisterId(event.target.value)}
              placeholder="Ex: R1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        {scheduleMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule Date &amp; Time (IST)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {canSchedule ? (
        <>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={sendNow} disabled={isSubmitting} className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              Send Now
            </button>
            <button type="button" onClick={() => (scheduleMode ? cancelSchedulePicker() : setScheduleMode(true))} disabled={isSubmitting} className="flex-1 rounded-md border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60">
              {scheduleMode ? 'Cancel Schedule' : 'Schedule It'}
            </button>
          </div>
          {scheduleMode && (
            <div className="flex gap-3">
              {editingSchedule && (
                <button type="button" onClick={() => { resetForm(); onCancelEdit?.(); }} disabled={isSubmitting} className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  Cancel
                </button>
              )}
              <button type="button" onClick={saveSchedule} disabled={isSubmitting} className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Saving...' : editingSchedule ? (editingSchedule.status === 'pending' ? 'Save Changes' : 'Reschedule Notification') : 'Confirm Schedule'}
              </button>
            </div>
          )}
        </>
      ) : (
        <button type="button" onClick={sendNow} disabled={isSubmitting} className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Sending...' : 'Send Notification'}
        </button>
      )}
    </div>
  );
}

export default NotificationForm;
