import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Database, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const formatBytes = (bytes, decimals = 1) => {
  const value = Number(bytes) || 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(decimals)} ${units[index]}`;
};

const formatCommands = (commands) => {
  const value = Number(commands) || 0;
  if (value < 1000) return value.toLocaleString();
  return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
};

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-xl font-bold text-red-600">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Deleting...' : 'DELETE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RedisMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [modal, setModal] = useState({ type: null, key: null });

  const syncData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/monitor/redis`);
      setData(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch Redis data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(syncData);
  }, [syncData]);

  const deleteKey = async () => {
    const key = modal.key;
    setDeletingKey(key);
    try {
      await axios.delete(`${API_URL}/api/monitor/redis/key`, { data: { key } });
      toast.success(`"${key}" deleted`);
      setModal({ type: null, key: null });
      await syncData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete Redis key');
    } finally {
      setDeletingKey(null);
    }
  };

  const deleteAll = async () => {
    setDeletingKey('__all__');
    try {
      const response = await axios.delete(`${API_URL}/api/monitor/redis/all`, { data: { confirm: true } });
      toast.success(`${response.data.deleted || 0} key(s) deleted`);
      setModal({ type: null, key: null });
      await syncData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete Redis data');
    } finally {
      setDeletingKey(null);
    }
  };

  const metrics = data?.metrics;
  const cards = [
    ['Commands', `${formatCommands(metrics?.commands)} / ${formatCommands(metrics?.commandLimit)}`],
    ['Bandwidth', `${formatBytes(metrics?.bandwidth)} / ${formatBytes(metrics?.bandwidthLimit, 0)}`],
    ['Storage', `${formatBytes(metrics?.storage)} / ${formatBytes(metrics?.storageLimit, 0)}`],
    ['Total keys', (metrics?.totalKeys || 0).toLocaleString()],
  ];


  
return (
  <div className="mx-auto max-w-6xl space-y-6 rounded-xl bg-white p-6 font-sans shadow-lg">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
        Upstash Redis Monitor
      </h2>
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
      {cards.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl bg-indigo-50 p-3 shadow-md"
        >
          <div className="text-xs font-medium uppercase text-indigo-600">
            {label}
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {value}
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={() => setModal({ type: 'all', key: null })}
        disabled={loading || !metrics?.totalKeys}
        className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete all
      </button>

      <button
        type="button"
        onClick={syncData}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-60"
      >
        <RefreshCcw
          className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Syncing...' : 'Sync'}
      </button>
    </div>

    {loading && !data ? (
      <div className="flex justify-center py-10 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-left font-bold text-gray-700">S.No.</th>
              <th className="p-3 text-left font-bold text-gray-700">Key Name</th>
              <th className="p-3 text-left font-bold text-gray-700">Size</th>
              <th className="p-3 text-left font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(data?.keys || []).map((item, index) => (
              <tr key={item.key} className="hover:bg-indigo-50">
                <td className="p-3 text-gray-600">{index + 1}</td>
                <td className="whitespace-nowrap p-3 font-medium text-gray-800">
                  {item.key}
                </td>
                <td className="whitespace-nowrap p-3 text-gray-600">
                  {formatBytes(item.size)}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    title="Delete key"
                    onClick={() => setModal({ type: 'key', key: item.key })}
                    disabled={Boolean(deletingKey)}
                    className="rounded-full p-1 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!data?.keys?.length && (
          <p className="p-8 text-center text-gray-500">
            No Redis keys found.
          </p>
        )}
      </div>
    )}

    <ConfirmationModal
      isOpen={modal.type !== null}
      title={modal.type === 'all' ? 'Delete all Redis data?' : 'Delete Redis key?'}
      message={
        modal.type === 'all'
          ? 'This permanently deletes every key in the database. This cannot be undone.'
          : `Are you sure you want to delete "${modal.key}"?`
      }
      onConfirm={modal.type === 'all' ? deleteAll : deleteKey}
      onCancel={() => setModal({ type: null, key: null })}
      loading={Boolean(deletingKey)}
    />
  </div>
);
}
