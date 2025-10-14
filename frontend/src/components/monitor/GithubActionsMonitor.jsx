// frontend/components/GithubActionsMonitor.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCcw, Clock, GitBranch, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

export default function GithubActionsMonitor() {
  const [data, setData] = useState({ metrics: null, workflows: [] });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/github/actions`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch GitHub Actions data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <h2 className="text-3xl font-semibold border-b pb-3 mb-4">GitHub Actions Monitor</h2>

      {/* Metrics Summary */}
      {data.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <MetricCard label="Avg Job Run Time" value={data.metrics.avgRunTime} />
          <MetricCard label="Avg Queue Time" value={data.metrics.avgQueueTime} />
          <MetricCard label="Job Failure Rate" value={data.metrics.failureRate} />
          <MetricCard label="Failed Job Usage" value={`${data.metrics.failedJobMinutes} mins`} />
          <MetricCard label="Total Minutes" value={`${data.metrics.totalMinutes} mins`} />
          <MetricCard label="Total Job Runs" value={data.metrics.totalRuns} />
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Workflows Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-bold text-gray-700">Workflow</th>
              <th className="p-3 text-left font-bold text-gray-700">State</th>
              <th className="p-3 text-left font-bold text-gray-700">Next 5 Runs (IST)</th>
              <th className="p-3 text-left font-bold text-gray-700">Previous 5 Runs</th>
            </tr>
          </thead>
          <tbody>
            {data.workflows.map((wf) => (
              <tr key={wf.id} className="hover:bg-indigo-50 transition">
                <td className="p-3 font-semibold flex items-center gap-2 text-indigo-700">
                  <GitBranch className="w-4 h-4" /> {wf.name}
                </td>
                <td className="p-3">{wf.state}</td>
                <td className="p-3">
                  {wf.nextRuns?.length ? (
                    <ul className="list-disc ml-5 space-y-1">
                      {wf.nextRuns.map((t, i) => (
                        <li key={i} className="text-gray-700">{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">No schedule</span>
                  )}
                </td>
                <td className="p-3">
                  {wf.prevRuns?.length ? (
                    <ul className="space-y-1">
                      {wf.prevRuns.map((r) => (
                        <li key={r.id} className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm ${
                              r.conclusion === 'success'
                                ? 'text-green-600'
                                : r.conclusion === 'failure'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            } hover:underline`}
                          >
                            {r.created_at}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">No runs</span>
                  )}
                </td>
              </tr>
            ))}
            {data.workflows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  {loading ? 'Loading workflows...' : 'No workflows found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
      <div className="text-xs font-medium text-indigo-600 uppercase">{label}</div>
      <div className="font-bold text-gray-900 text-lg">{value}</div>
    </div>
  );
}
