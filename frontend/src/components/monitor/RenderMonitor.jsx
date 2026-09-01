import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Globe, HardDrive, Layers, RefreshCcw, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const breakdownLabels = [
  ['serviceInitiated', 'Service-Initiated'],
  ['httpResponses', 'HTTP Responses'],
  ['websocketResponses', 'WebSocket Responses'],
  ['privateLink', 'Private Link'],
];

export default function RenderMonitor() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/monitor/render/usage`);
      setUsage(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch Render usage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = window.setInterval(fetchUsage, 60000);
    return () => window.clearInterval(interval);
  }, [fetchUsage]);

  return (
    <section className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-gray-900">Backend Render Monitor</h2>
          </div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">    
        <UsageCard icon={HardDrive} label="Bandwidth" resource={usage?.resources?.bandwidth} />
        <UsageCard icon={Server} label="Services" resource={usage?.resources?.services} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bandwidth Breakdown</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr><th className="p-3 text-left font-bold text-gray-700">Source</th><th className="p-3 text-right font-bold text-gray-700">Usage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breakdownLabels.map(([key, label]) => (
                <tr key={key} className="hover:bg-indigo-50 transition">
                  <td className="p-3 flex items-center gap-2 text-gray-800"><Layers className="w-4 h-4 text-indigo-500" />{label}</td>
                  <td className="p-3 text-right font-semibold text-gray-900">{usage?.breakdown?.[key]?.value ?? '...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function UsageCard({ icon: Icon, label, resource }) {
  const displayValue = resource?.used ?? '...';

  return (
    <div className="p-2 bg-indigo-50 rounded-xl shadow-md">
      <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 uppercase"><Icon className="w-4 h-4" />{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2"><span className="font-bold text-gray-900 text-lg">{displayValue}</span><span className="text-xs text-gray-500">of {resource?.limit ?? '...'}</span></div>
      <div className="mt-3 h-2 rounded-full bg-indigo-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(resource?.usagePercent || 0, 100)}%` }} /></div>
      <div className="mt-1 text-right text-xs text-gray-500">{resource ? `${resource.usagePercent}% used` : 'Loading...'}</div>
    </div>
  );
}
