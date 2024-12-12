import { User, Calendar, Bell } from 'lucide-react';

function NotificationHistory({ notifications }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-3">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Bell className="mr-2" /> Notification History
        </h2>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-gray-600">{notification.body}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                <span>From: {notification.sender?.name || 'System'}</span>
                <Calendar className="h-4 w-4 ml-4 mr-1" />
                <span>{formatDate(notification.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No notifications found
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationHistory;
