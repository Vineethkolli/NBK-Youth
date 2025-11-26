import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
  LogOut,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { API_URL } from '../../utils/config';

function SessionsManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(null);

  useEffect(() => {
    if (expanded) fetchSessions();
  }, [expanded]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/sessions`, {
        withCredentials: true,
      });
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error('Failed to load sessions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (sessionId) => {
    setSigningOut(sessionId);
    try {
      await axios.delete(`${API_URL}/api/sessions/${sessionId}`, {
        withCredentials: true,
      });
      toast.success('Session signed out successfully');
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (error) {
      toast.error('Failed to sign out session');
      console.error(error);
    } finally {
      setSigningOut(null);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getAccessModeLabel = (mode) => {
    const labels = {
      pwa: 'PWA',
      standalone: 'Standalone',
      twa: 'TWA',
      addtohomescreen: 'Home Screen',
      website: 'Browser',
    };
    return labels[mode] || mode;
  };

  const formatFullDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatAction = (action) => {
    if (action === 'signin') return 'Signin';
    if (action === 'signup') return 'Signup';
    if (action === 'google-signin') return 'Google Signin';
    if (action === 'google-signup') return 'Google Signup';
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.floor((n - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="border-t border-gray-200 mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">My Sessions</span>
          <span className="text-xs text-gray-500">({sessions.length})</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active sessions found</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={`border rounded-lg p-4 relative ${
                    session.isCurrent ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  {/* TOP-RIGHT SIGN OUT BUTTON */}
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleSignOut(session._id)}
                      disabled={signingOut === session._id}
                      className="
                        absolute top-2 right-2
                        inline-flex items-center 
                        px-2.5 py-1
                        border border-transparent 
                        text-xs font-medium rounded
                        text-red-700 bg-red-100 
                        hover:bg-red-200 
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {signingOut === session._id ? (
                        <div className="animate-spin h-3 w-3 border-2 border-red-700 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <LogOut className="h-3 w-3 mr-1" />
                          Sign Out
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex items-start space-x-3">
                    <div className="text-gray-600 mt-1">
                      {getDeviceIcon(session.deviceInfo?.deviceType)}
                    </div>

                    <div className="flex-1 pr-10">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {session.deviceInfo?.deviceModel || 'Unknown Device'}
                        </h4>

                        {session.isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-1 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Monitor className="h-3 w-3 mr-1" />
                          {session.deviceInfo?.browserName} • {session.deviceInfo?.os} •{' '}
                          {getAccessModeLabel(session.deviceInfo?.accessMode)}
                        </div>

                        {session.location?.city && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.location.city ? `${session.location.city}, ` : ''}
                            {session.location.state ? `${session.location.state}, ` : ''}
                            {session.location.country || ''}
                          </div>
                        )}

                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatAction(session.action)} — {formatFullDateTime(session.createdAt)}
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Last active {formatTime(session.lastActive)}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SessionsManager;
