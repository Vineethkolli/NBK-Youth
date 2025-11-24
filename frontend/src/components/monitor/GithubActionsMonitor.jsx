import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { RefreshCcw, Clock, GitBranch, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

export default function GithubActionsMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workflowFilter, setWorkflowFilter] = useState('all');

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/monitor/github/actions/workflows`);
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch workflows');
    }
  }, []);

  // Fetch metrics (always based on last 100 runs)
  const fetchMetrics = useCallback(async (workflow = workflowFilter) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/monitor/github/actions/metrics?workflow=${encodeURIComponent(workflow)}`
      );
      setMetrics(res.data.metrics || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [workflowFilter]);

  // combined fetch for initial load or sync
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchWorkflows(), fetchMetrics(workflowFilter)]);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflows, fetchMetrics, workflowFilter]);

  useEffect(() => {
    fetchAll();
  }, []); 

  // Re-fetch metrics when workflow filter changes
  useEffect(() => {
    fetchMetrics(workflowFilter);
  }, [workflowFilter, fetchMetrics]);

  const workflowOptions = useMemo(() => {
    return [{ id: 'all', name: 'All Workflows' }, ...workflows.map((w) => ({ id: String(w.id), name: w.name }))];
  }, [workflows]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <h2 className="text-2xl font-semibold text-gray-900 pb-3 mb-4">GitHub Actions Monitor</h2>
       <p className="text-gray-500 text-sm flex items-center gap-1">
        <Info className="w-4 h-4 text-blue-500" />
        Data is from the last 100 jobs
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Workflow:</label>
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="px-3 py-1 rounded-lg border bg-white"
          >
            {workflowOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-2/3">
        <MetricCard label="Total Workflows" value={metrics ? metrics.totalWorkflows : '...'} />
        <MetricCard label="Total Minutes" value={metrics ? `${metrics.totalMinutes} mins` : '...'} />
        <MetricCard label="Total Job Runs" value={metrics ? metrics.totalRuns : '...'} />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-2/3">
        <MetricCard label="Avg Job Run Time" value={metrics ? metrics.avgRunTime : '...'} />
        <MetricCard label="Avg Job Queue Time" value={metrics ? metrics.avgQueueTime : '...'} />
        <MetricCard label="Job Failure Rate" value={metrics ? metrics.failureRate : '...'} />
        <MetricCard label="Failed Job Usage" value={metrics ? `${metrics.failedJobMinutes} mins` : '...'} />
      </div>

      {/* Workflows Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-center font-bold text-gray-700">S.No</th>
              <th className="p-3 text-left font-bold text-gray-700">Workflow Name</th>
              <th className="p-3 text-left font-bold text-gray-700">Schedule</th>
              <th className="p-3 text-left font-bold text-gray-700">Last 5 Runs</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workflows.map((wf, index) => (
              <tr key={wf.id} className="hover:bg-indigo-50 transition">
                <td className="p-3 text-center">{index + 1}</td>
                <td className="p-3 font-semibold flex items-center gap-2 text-indigo-700 text-left align-middle">
                  <GitBranch className="w-4 h-4 flex-shrink-0" /> {wf.name}
                </td>
                <td className="p-3">
                  {wf.schedules?.length ? (
                    <ul className="list-disc ml-5 space-y-1 max-w-[180px] md:max-w-[250px] break-words">
                      {wf.schedules.map((s, i) => (
                        <li key={i} className="text-gray-700 truncate">{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">No schedule</span>
                  )}
                </td>
                <td className="p-3">
                  {wf.prevRuns?.length ? (
                    <ul className="space-y-1 max-w-[220px] md:max-w-[300px]">
                      {wf.prevRuns.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 truncate">
                          <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm truncate ${
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

            {workflows.length === 0 && (
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
