import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { RefreshCcw, Folder } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CloudinaryMonitor() {
  const [quota, setQuota] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await api.get(`/api/monitor/cloudinary/quota`);
      setQuota(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch Cloudinary quota');
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/monitor/cloudinary/folders`);
      setFolders(res.data.folders || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch Cloudinary folders');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = () => {
    fetchQuota();
    fetchFolders();
  };

  useEffect(() => {
    syncData();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <h2 className="text-2xl font-semibold text-gray-900  pb-3 mb-4">Cloudinary Monitor</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-2/3">
        <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
          <div className="text-xs font-medium text-indigo-600 uppercase">Storage Limit</div>
          <div className="font-bold text-gray-900 text-lg">{quota?.lifetime?.storageLimitReadable ?? '...'}</div>
        </div>
        <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
          <div className="text-xs font-medium text-indigo-600 uppercase">Storage Used</div>
          <div className="font-bold text-gray-900 text-lg">{quota?.lifetime?.storageUsedReadable ?? '...'}</div>
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <button
          onClick={syncData}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Folder Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-left font-bold text-gray-700 w-1">S.No.</th>
              <th className="p-3 text-left font-bold text-gray-700">Folder Name</th>
              <th className="p-3 text-left font-bold text-gray-700">Size</th>
              <th className="p-3 text-center font-bold text-gray-700">Count</th>
            </tr>
          </thead>
          <tbody>
            {folders.map((f, idx) => (
              <tr key={f.folder} className="hover:bg-indigo-50 transition cursor-pointer">
                <td className="p-3 text-gray-600 text-center">{idx + 1}</td>
                <td className="p-3 text-gray-800 flex items-center gap-2">
  <Folder className="w-5 h-5 text-indigo-500" />
  {f.folder === 'root' ? 'Home' : f.folder.split('/').pop()}
</td>
                <td className="p-3 text-gray-600">{f.sizeReadable}</td>
                <td className="p-3 text-center text-gray-600">{f.count}</td>
              </tr>
            ))}
            {folders.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  {loading ? 'Loading folders...' : 'No folders found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
