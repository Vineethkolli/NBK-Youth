import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronRight, ChevronDown, Filter, Columns, BarChart3, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import axios from 'axios';
import AuthSessionsTable from '../components/authSessions/SessionsTable';
import AuthSessionsFilters from '../components/authSessions/Filters';
import AuthSessionStats from '../components/authSessions/Stats';


function AuthSessions() {
  const { hasAccess } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState('');
  const [openPanel, setOpenPanel] = useState(null);
  const [activeTab, setActiveTab] = useState("sessions");

  const [filters, setFilters] = useState({
    isValid: '',
    action: '',
    sortOrder: '',
  });

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    registerId: true,
    name: true,
    action: true,
    createdAt: true,
    lastActive: true,
    accessMode: true,
    deviceInfo: false,
    location: false,
    expiresAt: false,
    isValid: true,
  });

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    } else {
      fetchStats();
    }
  }, [search, filters, activeTab]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({
        search,
        ...filters,
      });

      const { data } = await axios.get(`${API_URL}/api/sessions/auth-sessions?${params}`);
      setSessions(data);
    } catch {
      toast.error('Failed to fetch sessions');
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/sessions/stats`);
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    }
  };

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  if (!hasAccess('Developer')) {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold">Auth Sessions</h1>
  <div className="flex items-center space-x-3">
    <button
      onClick={() => setActiveTab("sessions")}
      className={`px-2 py-2 rounded-md font-semibold flex items-center ${
        activeTab === "sessions"
          ? "bg-indigo-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      <List className="h-4 w-4 mr-1" />
      Sessions
    </button>

    <button
      onClick={() => setActiveTab("stats")}
      className={`px-2 py-2 rounded-md font-semibold flex items-center ${
        activeTab === "stats"
          ? "bg-indigo-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      <BarChart3 className="h-4 w-4 mr-1" />
      Stats
    </button>
  </div>
</div>

      {activeTab === "sessions" && (
        <>
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by RegID, name, action, access mode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-1 w-full border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOpenPanel(openPanel === "filters" ? null : "filters")}
                className="flex items-center gap-3 px-3 py-1 bg-white rounded-md shadow border"
              >
                <span className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  Filters
                </span>
                {openPanel === "filters" ? <ChevronDown /> : <ChevronRight />}
              </button>
              <button
                onClick={() => setOpenPanel(openPanel === "columns" ? null : "columns")}
                className="flex items-center gap-3 px-3 py-1 bg-white rounded-md shadow border"
              >
                <span className="font-medium flex items-center gap-2">
                  <Columns className="h-4 w-4 text-gray-600" />
                  Columns
                </span>
                {openPanel === "columns" ? <ChevronDown /> : <ChevronRight />}
              </button>
            </div>

            {openPanel === "filters" && (
              <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
                <AuthSessionsFilters filters={filters} onChange={handleFilterChange} />
              </div>
            )}

            {openPanel === "columns" && (
              <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {Object.entries(visibleColumns).map(([column, isVisible]) => (
                    <label key={column} className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleColumnToggle(column)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 capitalize">{column}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow">
            <AuthSessionsTable sessions={sessions} visibleColumns={visibleColumns} />
          </div>
        </>
      )}

      {activeTab === "stats" && stats && (
        <AuthSessionStats stats={stats} />
      )}
    </div>
  );
}

export default AuthSessions;
