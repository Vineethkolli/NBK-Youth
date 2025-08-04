import React from 'react';
import NotificationSettings from '../components/settings/NotificationSettings';
import NotificationForm from '../components/notifications/NotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';

function Notifications() {
  return (
    <div className="max-w-1xl mx-auto space-y-8">
      <NotificationSettings />
      <NotificationForm />
      <NotificationHistory />
    </div>
  );
}

export default Notifications;