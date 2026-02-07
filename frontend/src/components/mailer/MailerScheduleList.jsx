import { CalendarClock } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700'
};

const formatRecipients = (recipients) => {
  if (!recipients?.length) return 'No recipients';
  const preview = recipients
    .slice(0, 4)
    .map((rec) => rec.registerId || rec.email)
    .join(', ');
  const remaining = recipients.length - 4;
  return remaining > 0 ? `${preview} +${remaining}` : preview;
};

function MailerScheduleList({ schedules, loading }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Emails</h3>
          <p className="text-xs text-gray-500">Emails will be sent at their exact scheduled time (IST)</p>
        </div>
        <CalendarClock className="h-5 w-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : schedules.length === 0 ? (
        <div className="text-sm text-gray-500">No scheduled emails.</div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{schedule.subject}</h4>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    statusStyles[schedule.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {schedule.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{schedule.body}</p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                <span>Send Date: {formatDateTime(schedule.scheduledAt)}</span>
                <span>Recipients: {schedule.totalRecipients}</span>
                <span>Target: {schedule.targetType}</span>
              </div>
              <div className="text-xs text-gray-500">{formatRecipients(schedule.recipients)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MailerScheduleList;
