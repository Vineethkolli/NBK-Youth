import { useState, useEffect } from 'react';
import { Trash2, Smartphone, Monitor, Calendar, Clock, MapPin } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/api/auth/sessions');
      setSessions(data.sessions);
    } catch (error) {
      toast.error('Failed to load sessions');
      console.error('Fetch sessions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId, isCurrent) => {
    if (isCurrent) {
      const confirmed = window.confirm(
        'This will log you out from this device. Are you sure?'
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        'Are you sure you want to remove this session?'
      );
      if (!confirmed) return;
    }

    try {
      await api.delete(`/api/auth/sessions/${sessionId}`);
      toast.success('Session removed successfully');
      
      if (isCurrent) {
        // Current session deleted, redirect to signin
        window.location.href = '/signin';
      } else {
        // Refresh the list
        fetchSessions();
      }
    } catch (error) {
      toast.error('Failed to remove session');
      console.error('Delete session error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDeviceIcon = (deviceInfo) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Active Sessions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage devices where you're currently logged in
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active sessions found
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                session.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-gray-600 mt-1">
                    {getDeviceIcon(session.deviceInfo)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {session.deviceInfo}
                      </h3>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>First login: {formatDate(session.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Last active: {formatTime(session.lastUsedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSession(session.id, session.isCurrent)}
                  className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove session"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Sessions expire after 12 months of inactivity. Removing a
          session will log you out from that device.
        </p>
      </div>
    </div>
  );
};

export default SessionsManager;
