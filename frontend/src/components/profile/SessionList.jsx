import { RefreshCw } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Unknown';
  }
};

const describeDevice = (info = {}) => {
  const parts = [info.device, info.os, info.browser].filter(Boolean);
  return parts.length ? parts.join(' • ') : 'Unknown device';
};

function SessionList({ sessions, loading, onRefresh, onSignout }) {
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
        Loading sessions...
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
        No active sessions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Manage sign-ins across your devices.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {sessions.map((session) => (
        <div
          key={session.id}
          className="border rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">
                {describeDevice(session.deviceInfo)}
              </p>
              <p className="text-sm text-gray-500">
                {session.location?.state || 'Unknown'}, {session.location?.country || 'Unknown'}
              </p>
            </div>

            {session.isCurrent ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Current session
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSignout(session.id)}
                className="px-3 py-1 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
              >
                Sign out
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>
              <span className="text-gray-500">Last active:</span> {formatDate(session.lastActive)}
            </p>
            <p>
              <span className="text-gray-500">Signed in:</span> {formatDate(session.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SessionList;
