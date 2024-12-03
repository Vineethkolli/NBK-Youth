import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToPushNotifications } from '../utils/notifications';

function Home() {
  const { user } = useAuth();

  useEffect(() => {
    // Request notification permission when user first lands on home page
    if (Notification.permission === 'default') {
      subscribeToPushNotifications().catch(console.error);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Hello, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your dashboard. You are logged in as a {user.role}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;