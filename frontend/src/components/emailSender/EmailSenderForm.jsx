import { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const targetOptions = [
  { value: 'All', label: 'All Users' },
  { value: 'RegisterId', label: 'Specific Register ID' },
  { value: 'Email', label: 'Specific Email' }
];

function EmailSenderForm({ onScheduled, onSent }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [footer, setFooter] = useState('');
  const [target, setTarget] = useState('All');
  const [registerId, setRegisterId] = useState('');
  const [email, setEmail] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTargetRegister = target === 'RegisterId';
  const isTargetEmail = target === 'Email';

  const preview = useMemo(() => {
    return {
      subject: subject || 'Subject...',
      body: content || 'Email body...'
    };
  }, [subject, content]);

  const resetForm = () => {
    setSubject('');
    setContent('');
    setFooter('');
    setTarget('All');
    setRegisterId('');
    setEmail('');
    setScheduleMode(false);
    setScheduleDate('');
  };

  const buildPayload = () => ({
    subject,
    content,
    footer,
    target,
    registerId: isTargetRegister ? registerId.trim() : undefined,
    email: isTargetEmail ? email.trim() : undefined
  });

  const validatePayload = () => {
    if (!subject.trim() || !content.trim() || !footer.trim()) {
      toast.error('Subject, body, and footer are required');
      return false;
    }

    if (isTargetRegister && !registerId.trim()) {
      toast.error('Register ID is required');
      return false;
    }

    if (isTargetEmail && !email.trim()) {
      toast.error('Email address is required');
      return false;
    }

    return true;
  };

  const sendNow = async () => {
    if (!validatePayload()) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const { data } = await axios.post(`${API_URL}/api/email-sender/send`, payload);
      toast.success(data?.message || 'Email send started');
      if (onSent && data?.history) onSent(data.history);
      resetForm();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start email send';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleEmail = async () => {
    if (!validatePayload()) return;
    if (!scheduleDate) {
      toast.error('Schedule date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...buildPayload(), scheduleDate };
      const { data } = await axios.post(`${API_URL}/api/email-sender/schedule`, payload);
      toast.success(data?.message || 'Email scheduled');
      if (onScheduled && data?.schedule) onScheduled(data.schedule);
      resetForm();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to schedule email';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Body *</label>
            <textarea
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Write email body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Footer *</label>
            <textarea
              rows={2}
              value={footer}
              onChange={(event) => setFooter(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Send To</label>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isTargetRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Register ID</label>
              <input
                type="text"
                value={registerId}
                onChange={(event) => setRegisterId(event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ex: R1"
              />
            </div>
          )}

          {isTargetEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="example@email.com"
              />
            </div>
          )}

          {scheduleMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={sendNow}
            disabled={isSubmitting}
            className={`flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            Send Now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode((prev) => !prev)}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            {scheduleMode ? 'Cancel Schedule' : 'Schedule It'}
          </button>
        </div>

        {scheduleMode && (
          <button
            type="button"
            onClick={scheduleEmail}
            disabled={isSubmitting}
            className={`w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            Confirm Schedule
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 space-y-3">
            <h4 className="text-base font-semibold text-gray-900">{preview.subject}</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{preview.body}</p>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 whitespace-pre-line">
            {footer || 'Footer...'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSenderForm;
