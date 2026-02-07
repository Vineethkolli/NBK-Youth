import { Clock } from 'lucide-react';
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

function MailerHistoryList({ history, loading }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mailer History</h3>
        </div>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-sm text-gray-500">No emails sent yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry._id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{entry.subject}</h4>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    statusStyles[entry.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {entry.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{entry.body}</p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                <span>Sent: {formatDateTime(entry.sentAt)}</span>
                <span>Completed: {formatDateTime(entry.completedAt)}</span>
                <span>Recipients: {entry.totalRecipients}</span>
                <span>Target: {entry.targetType}</span>
              </div>
              <div className="text-xs text-gray-500">{formatRecipients(entry.recipients)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MailerHistoryList;
