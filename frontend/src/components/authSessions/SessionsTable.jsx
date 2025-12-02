import { formatDateTime } from '../../utils/dateTime';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function AuthSessionsTable({ sessions, visibleColumns, pagination, onPageChange }) {
  if (sessions.length === 0) {
    return (
      <div>
        <h3 className="text-gray-500 text-center py-4">No sessions found</h3>
      </div>
    );
  }

  const formatDeviceInfo = (deviceInfo) => {
    if (!deviceInfo) return '-';
    const parts = [];
    if (deviceInfo.deviceType && deviceInfo.deviceType !== 'unknown') {
      parts.push(deviceInfo.deviceType);
    }
    if (deviceInfo.deviceModel && deviceInfo.deviceModel !== 'unknown') {
      parts.push(deviceInfo.deviceModel);
    }
    if (deviceInfo.os && deviceInfo.os !== 'unknown') {
      parts.push(deviceInfo.os);
    }
    if (deviceInfo.browserName && deviceInfo.browserName !== 'unknown') {
      parts.push(deviceInfo.browserName);
    }
    return parts.length > 0 ? parts.join(' | ') : '-';
  };

  const formatLocation = (location) => {
    if (!location) return '-';
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns.sno && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
            )}
            {visibleColumns.registerId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RegID</th>
            )}
            {visibleColumns.name && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            )}
            {visibleColumns.action && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            )}
            {visibleColumns.createdAt && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
            )}
            {visibleColumns.lastActive && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
            )}
            {visibleColumns.accessMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Mode</th>
            )}
            {visibleColumns.deviceInfo && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Info</th>
            )}
            {visibleColumns.location && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            )}
            {visibleColumns.expiresAt && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires At</th>
            )}
            {visibleColumns.isValid && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {sessions.map((session, index) => {
            const isExpired = new Date(session.expiresAt) < new Date();
            
            return (
              <tr key={session._id} className={!session.isValid || isExpired ? 'bg-gray-50' : ''}>
                {visibleColumns.sno && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                )}
                {visibleColumns.registerId && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.userId?.registerId || '-'}
                  </td>
                )}
                {visibleColumns.name && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.userId?.name || '-'}
                  </td>
                )}
                {visibleColumns.action && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      session.action === 'signin' ? 'bg-blue-100 text-blue-800' :
                      session.action === 'signup' ? 'bg-green-100 text-green-800' :
                      session.action === 'google-signin' ? 'bg-purple-100 text-purple-800' :
                      session.action === 'google-signup' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.action}
                    </span>
                  </td>
                )}
                {visibleColumns.createdAt && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(session.createdAt)}
                  </td>
                )}
                {visibleColumns.lastActive && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(session.lastActive)}
                  </td>
                )}
                {visibleColumns.accessMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      session.deviceInfo?.accessMode === 'pwa' ? 'bg-indigo-100 text-indigo-800' :
                      session.deviceInfo?.accessMode === 'standalone' ? 'bg-teal-100 text-teal-800' :
                      session.deviceInfo?.accessMode === 'twa' ? 'bg-cyan-100 text-cyan-800' :
                      session.deviceInfo?.accessMode === 'website' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.deviceInfo?.accessMode || 'unknown'}
                    </span>
                  </td>
                )}
                {visibleColumns.deviceInfo && (
                  <td className="px-6 py-4 text-sm">
                    {formatDeviceInfo(session.deviceInfo)}
                  </td>
                )}
                {visibleColumns.location && (
                  <td className="px-6 py-4 text-sm">
                    {formatLocation(session.location)}
                  </td>
                )}
                {visibleColumns.expiresAt && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={isExpired ? 'text-red-600' : ''}>
                      {formatDateTime(session.expiresAt)}
                    </span>
                  </td>
                )}
                {visibleColumns.isValid && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      session.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {session.isValid ? 'True' : 'False'}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalCount} total entries)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthSessionsTable;
