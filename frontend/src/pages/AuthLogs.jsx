import { useState, useEffect } from 'react';
import { Search, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/dateTime';

function AuthLogs() {
  const { hasAccess } = useAuth();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [showLatest, setShowLatest] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);

  if (!hasAccess('Developer')) {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, page });
      if (showLatest) params.append('latest', 'true');
      const { data } = await axios.get(`${API_URL}/api/authlogs?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch auth logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, showLatest]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) fetchLogs(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center">Auth Logs</h1>

        <button
          onClick={() => setShowLatest(!showLatest)}
          className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition ${
            showLatest
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          {'Latest per User'}
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by Reg ID, Name, Action, Access Mode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-lg"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-gray-500">
                  <Loader2 className="inline h-5 w-5 mr-2 animate-spin text-gray-400" />
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-6 text-center text-gray-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const browserInfo = log.deviceInfo?.browser
                  ? [
                      log.deviceInfo.browser.name,
                      log.deviceInfo.browser.version,
                      log.deviceInfo.browser.osName,
                      log.deviceInfo.browser.osVersion
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : '—';

                return (
                  <tr key={log._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.registerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDateTime(log.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.action === 'signin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.deviceInfo?.accessMode || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.deviceInfo?.deviceType || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.deviceInfo?.deviceModel || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.deviceInfo?.platform || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{browserInfo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AuthLogs;
