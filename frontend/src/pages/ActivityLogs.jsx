import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Clock, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import LogTable from '../components/activityLogs/LogTable';
import LogFilters from '../components/activityLogs/LogFilters';
import LogStats from '../components/activityLogs/LogStats';
import LogPrint from '../components/activityLogs/LogPrint';
import LogStatsPrint from '../components/activityLogs/LogStatsPrint';

function ActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    registerId: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  if (!['developer'].includes(user?.role)) return <div>Access denied</div>;

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, search, filters, pagination.currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: pagination.currentPage,
        limit: 50,
        ...filters
      });

      const { data } = await axios.get(`${API_URL}/api/activity-logs?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/activity-logs/stats`);
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch log statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, currentPage: newPage });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
        <h1 className="text-2xl font-semibold">Activity Logs</h1>

        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md font-semibold flex items-center ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 mr-2" />
            Logs
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md font-semibold flex items-center ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </button>

          {activeTab === 'logs' ? (
            <LogPrint filters={filters} search={search} />
          ) : (
            <LogStatsPrint stats={stats} />
          )}
        </div>
      </div>

      {activeTab === 'logs' && (
        <>
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by register ID, name, description, or entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg"
              />
            </div>
            <LogFilters filters={filters} onChange={handleFilterChange} />
          </div>

          <div className="bg-white rounded-lg shadow">
            <LogTable
              logs={logs}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      {activeTab === 'stats' && <LogStats stats={stats} loading={loading} />}
    </div>
  );
}

export default ActivityLogs;
