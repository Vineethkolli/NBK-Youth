import Linkify from 'react-linkify';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/dateTime';

function NotificationHistory({ history, loading }) {


  const linkDecorator = (href, text, key) => (
    <button
      key={key}
      onClick={() => window.open(href, '_blank')}
      className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-2 py-1 text-center mr-2 mb-2"
      aria-label={`Open link to ${href}`}
    >
      Open Link
      <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5" />
    </button>
  );

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
              <p className="text-gray-600 mt-1">
                <Linkify componentDecorator={linkDecorator}>{notif.body}</Linkify>
              </p>
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
