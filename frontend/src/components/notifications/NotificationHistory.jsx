import { ExternalLink } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

function NotificationHistory({ history, loading, activeTab, onTabChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <h2 className="text-lg font-semibold mb-4">Notification History</h2>
      <div className="flex border-b border-gray-200 mb-4" role="tablist" aria-label="Notification history type">
        {[
          { value: 'received', label: 'Received History' },
          { value: 'sent', label: 'Sent History' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : history.length === 0 ? (
        <div>No {activeTab} notifications found.</div>
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
              {activeTab === 'sent' && notif.recipients?.length > 0 && (
                <div className="mt-1 text-sm text-gray-500">
                  <span className="font-medium">Sent to:</span>{' '}
                  {notif.recipients.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationHistory;
