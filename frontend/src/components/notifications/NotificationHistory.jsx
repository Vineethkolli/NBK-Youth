import { ExternalLink } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

function NotificationHistory({ history, loading }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <h2 className="text-lg font-semibold mb-4">Notification History</h2>
      {loading ? (
        <div>Loading...</div>
      ) : history.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {history.map((notif) => (
            <div
              key={notif._id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-lg">{notif.title}</h4>
              <p className="text-gray-600 mt-1">{notif.body}</p>

              {notif.link && (
                <button
                  onClick={() => {
                    const isExternal = notif.link.startsWith('http');
                    const target = isExternal ? '_blank' : '_self';
                    window.open(notif.link, target);
                  }}
                  className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-2 py-1 mt-2"
                  aria-label={`Open link to ${notif.link}`}
                >
                  Open
                  <ExternalLink className="ml-2 h-5 w-5" />
                </button>
              )}

              <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
                <span>{formatDateTime(notif.createdAt)}</span>
                <span className="text-indigo-600">Sent by: {notif.sentBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationHistory;
