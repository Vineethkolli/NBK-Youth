import { useState } from 'react';
import { Bell, User, Calendar, Search } from 'lucide-react';

function NotificationHistory({ notifications }) {
  const [search, setSearch] = useState('');

  const filteredNotifications = notifications.filter(notification => 
    notification.title.toLowerCase().includes(search.toLowerCase()) ||
    notification.body.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-3">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Bell className="mr-2" /> Notification History
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-gray-600">{notification.body}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                <span>From: {notification.sender?.name || 'System'}</span>
                <Calendar className="h-4 w-4 ml-4 mr-1" />
                <span>{formatDate(notification.createdAt)}</span>
              </div>
              {notification.isGlobal && (
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Global
                </span>
              )}
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