import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

export default function MongoDBMonitor() {
  const [clusterInfo, setClusterInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/mongodb/cluster`);
      setClusterInfo(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch MongoDB data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return value.toFixed(2) + ' ' + units[i];
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <h2 className="text-3xl font-semibold border-b pb-3 mb-4">MongoDB Monitor</h2>

      {/* Cluster Info */}
      {clusterInfo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-full">
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Cluster</div>
            <div className="font-bold text-gray-900 text-lg">{clusterInfo.cluster.name}</div>
            <div className="text-gray-600 text-xs">{clusterInfo.cluster.state}</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Storage Used</div>
            <div className="font-bold text-gray-900 text-lg">{formatBytes(clusterInfo.quota.storageUsed)}</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Storage Limit</div>
            <div className="font-bold text-gray-900 text-lg">{formatBytes(clusterInfo.quota.storageLimit)}</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Connections</div>
            <div className="font-bold text-gray-900 text-lg">
              {clusterInfo.quota.connections.active} / {clusterInfo.quota.connections.max}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Databases Table */}
      {clusterInfo && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3 text-left font-bold text-gray-700">S.No.</th>
                <th className="p-3 text-left font-bold text-gray-700">Database Name</th>
                <th className="p-3 text-center font-bold text-gray-700">Collections</th>
                <th className="p-3 text-center font-bold text-gray-700">Storage</th>
              </tr>
            </thead>
            <tbody>
              {clusterInfo.databases.map((db, idx) => (
                <tr key={db.name} className="hover:bg-indigo-50 transition cursor-default">
                  <td className="p-3 text-center text-gray-600">{idx + 1}</td>
                  <td className="p-3 text-gray-800">{db.name}</td>
                  <td className="p-3 text-center text-gray-600">{db.collections}</td>
                  <td className="p-3 text-center text-gray-600">{formatBytes(db.storage)}</td>
                </tr>
              ))}
              {clusterInfo.databases.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    {loading ? 'Loading databases...' : 'No databases found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
