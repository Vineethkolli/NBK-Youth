import { CalendarClock, Eye } from 'lucide-react';
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

function MailerScheduleList({ schedules, loading, onView }) {
  return (
    <div className="min-w-0 bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex min-w-0 items-center justify-between mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Scheduled Emails
          </h3>

          <p className="text-xs text-gray-500">
            Emails will be sent at their scheduled time (IST)
          </p>
        </div>

        <CalendarClock className="h-5 w-5 shrink-0 text-gray-400" />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-sm text-gray-500">
          No scheduled emails.
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule._id}
              className="min-w-0 border rounded-lg p-4 space-y-2"
            >
              {/* Subject + Actions + Status */}
              <div className="flex min-w-0 items-start justify-between gap-2">
                <h4 className="min-w-0 break-words font-semibold text-gray-900">
                  {schedule.subject}
                </h4>

                <div className="flex shrink-0 items-center gap-1">
                  {/* View Email */}
                  <button
                    type="button"
                    onClick={() => onView(schedule)}
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition"
                    title="View email"
                    aria-label="View email"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  {/* Status */}
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      statusStyles[schedule.status] ||
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {schedule.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Body Preview */}
              <p className="break-words text-sm text-gray-600 line-clamp-2">
                {schedule.body}
              </p>

              {/* Email Information */}
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                <span>
                  Send Date: {formatDateTime(schedule.scheduledAt)}
                </span>

                <span>
                  Recipients: {schedule.totalRecipients}
                </span>

                <span>
                  Target: {schedule.targetType}
                </span>
              </div>

              {/* Recipient Preview */}
              <div className="break-words text-xs text-gray-500">
                {formatRecipients(schedule.recipients)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MailerScheduleList;
