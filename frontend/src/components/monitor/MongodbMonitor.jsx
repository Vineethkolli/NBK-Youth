import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { RefreshCcw, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MongoDBMonitor() {
  const [quota, setQuota] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resCluster = await api.get(`/api/monitor/mongodb/cluster`);
      setQuota(resCluster.data.quota);
      setDatabases(resCluster.data.databases || []);

      const defaultDb = resCluster.data.databases?.[0]?.name;
      if (defaultDb) {
        const resColl = await api.get(`/api/monitor/mongodb/collections?dbName=${defaultDb}`);
        setCollections(resColl.data.collections || []);
      }
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
      <h2 className="text-2xl font-semibold text-gray-900 pb-3 mb-4">MongoDB Monitor</h2>

      {/* Storage & Databases Info */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm w-full md:w-full">
  <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
    <div className="text-xs font-medium text-indigo-600 uppercase">Storage Limit</div>
    <div className="font-bold text-gray-900 text-lg">
      {quota ? formatBytes(quota.storageLimit) : '...'}
    </div>
  </div>

  <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
    <div className="text-xs font-medium text-indigo-600 uppercase">Storage Used</div>
    <div className="font-bold text-gray-900 text-lg">
      {quota ? formatBytes(quota.storageUsed) : '...'}
    </div>
  </div>

  <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
    <div className="text-xs font-medium text-indigo-600 uppercase">Connections</div>
    <div className="font-bold text-gray-900 text-lg">
      {quota ? `${quota.connections.active} / ${quota.connections.max}` : '...'}
    </div>
  </div>

  {(databases && databases.length > 0
    ? databases
    : Array.from({ length: 3 }, (_, i) => ({ name: i, collections: null }))
  ).map((db) => (
    <div key={db.name} className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
      <div className="text-xs font-medium text-indigo-600 uppercase">Collections</div>
      <div className="font-bold text-gray-900 text-lg">
        {quota ? db.collections : '...'}
      </div>
    </div>
  ))}
</div>


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

      {/* Collections Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-center font-bold text-gray-700">S.No.</th>
              <th className="p-3 text-left font-bold text-gray-700">Collection Name</th>
              <th className="p-3 text-center font-bold text-gray-700">Documents</th>
              <th className="p-3 text-left font-bold text-gray-700">Storage</th>
              <th className="p-3 text-center font-bold text-gray-700">Indexes</th>
              <th className="p-3 text-left font-bold text-gray-700">Index Size</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c, idx) => (
              <tr key={c.name} className="hover:bg-indigo-50 transition cursor-default">
                <td className="p-3 text-gray-600 text-center">{idx + 1}</td>
                <td className="p-3 text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />{c.name}</td>
                <td className="p-3 text-center text-gray-600">{c.documents}</td>
                <td className="p-3 text-left text-gray-600">{formatBytes(c.storage)}</td>
                <td className="p-3 text-center text-gray-600">{c.indexes}</td>
                <td className="p-3 text-left text-gray-600">{formatBytes(c.indexSize)}</td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  {loading ? 'Loading collections...' : 'No collections found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
