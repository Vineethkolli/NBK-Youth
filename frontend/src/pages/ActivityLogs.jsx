import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Calendar, Download, Trash2, BarChart3, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import LogTable from '../components/logs/LogTable';
import LogFilters from '../components/logs/LogFilters';
import LogStats from '../components/logs/LogStats';
import LogPrint from '../components/logs/LogPrint'; 

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

  const handleClearOldLogs = async () => {
    const days = prompt('Delete logs older than how many days? (default: 30)');
    if (days === null) return;

    const daysToDelete = parseInt(days) || 30;
    
    if (!window.confirm(`Are you sure you want to delete logs older than ${daysToDelete} days? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data } = await axios.delete(`${API_URL}/api/activity-logs/clear`, {
        data: { days: daysToDelete }
      });
      toast.success(data.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      toast.error('Failed to clear old logs');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Activity Logs</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          ><Clock className="h-4 w-4 mr-2 inline" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            Statistics
          </button>
<LogPrint logs={logs} />
          <button
            onClick={handleClearOldLogs}
            className="btn-secondary text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2 inline" />
            Clear Logs
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <>
          <div className="space-y-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by register ID, name, description, or entity ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg"
                />
              </div>
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

      {activeTab === 'stats' && (
        <LogStats stats={stats} loading={loading} />
      )}
    </div>
  );
}

export default ActivityLogs;