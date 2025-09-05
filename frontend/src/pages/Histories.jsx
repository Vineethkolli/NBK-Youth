import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Printer, Trash2, Search, Filter, BarChart2, IndianRupee, DollarSign, CalendarDays } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import HistoryForm from '../components/histories/HistoryForm';
import HistoryStats from '../components/histories/HistoryStats';
import HistoryIncome from '../components/histories/HistoryIncome';
import HistoryExpense from '../components/histories/HistoryExpense';
import HistoryEvents from '../components/histories/HistoryEvents';
import EnglishPrint from '../components/histories/HistoryEnglishPrint';
import TeluguPrint from '../components/histories/HistoryTeluguPrint';
import { useLanguage } from '../context/LanguageContext';

function Histories() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [histories, setHistories] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBelongsTo, setShowBelongsTo] = useState(false);
  const [filters, setFilters] = useState({
    sort: 'desc',
    belongsTo: ''
  });

  const isPrivilegedUser = ['developer'].includes(user?.role);
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;

  useEffect(() => {
    fetchHistories();
    fetchSnapshots();
  }, []);

  const fetchHistories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/histories`);
      setHistories(data);
      if (data.length > 0 && !selectedHistory) {
        setSelectedHistory(data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch histories');
    }
  };

  const fetchSnapshots = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/snapshots`);
      setSnapshots(data);
    } catch (error) {
      console.error('Failed to fetch snapshots');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      await axios.post(`${API_URL}/api/histories`, formData);
      toast.success('History created successfully');
      setShowForm(false);
      fetchHistories();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create history');
      }
      throw error;
    }
  };

  const handleDelete = async (historyId) => {
    if (!window.confirm('Are you sure you want to delete this history?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/histories/${historyId}`);
      toast.success('History deleted successfully');
      fetchHistories();
      if (selectedHistory?._id === historyId) {
        setSelectedHistory(histories.length > 1 ? histories.find(h => h._id !== historyId) : null);
      }
    } catch (error) {
      toast.error('Failed to delete history');
    }
  };

  const getCurrentData = () => {
    if (!selectedHistory) return null;
    
    const snapshot = selectedHistory.snapshotData;
    if (!snapshot) return null;

    switch (activeTab) {
      case 'stats':
        return snapshot.stats || {};
      case 'income':
        return snapshot.collections?.Income || [];
      case 'expense':
        return snapshot.collections?.Expense || [];
      case 'events':
        return snapshot.collections?.Event || [];
      default:
        return null;
    }
  };

  const filteredData = () => {
    const data = getCurrentData();
    if (!data) return null;

    if (activeTab === 'income' || activeTab === 'expense') {
      let filtered = Array.isArray(data) ? [...data] : [];

      // Apply search
      if (searchQuery) {
        filtered = filtered.filter(item => {
          const searchLower = searchQuery.toLowerCase();
          return (
            item.name?.toLowerCase().includes(searchLower) ||
            item.purpose?.toLowerCase().includes(searchLower) ||
            item.incomeId?.toLowerCase().includes(searchLower) ||
            item.expenseId?.toLowerCase().includes(searchLower) ||
            item.amount?.toString().includes(searchQuery)
          );
        });
      }

      // Apply filters
      if (filters.belongsTo && activeTab === 'income') {
        filtered = filtered.filter(item => item.belongsTo === filters.belongsTo);
      }

      // Apply sorting
      if (filters.sort) {
        filtered.sort((a, b) => {
          const aAmount = Number(a.amount) || 0;
          const bAmount = Number(b.amount) || 0;
          return filters.sort === 'desc' ? bAmount - aAmount : aAmount - bAmount;
        });
      }

      return filtered;
    }

    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Histories</h1>

        <div className="flex items-center space-x-3">
          {isPrivilegedUser && (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`btn-secondary flex items-center ${isEditMode ? 'bg-red-100' : ''}`}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            </>
          )}

          <PrintComponent
            selectedHistory={selectedHistory}
            activeTab={activeTab}
            data={filteredData()}
            showBelongsTo={showBelongsTo}
          />
        </div>
      </div>

      {/* Event List */}
      <div className="bg-white rounded-lg shadow p-2">
        {histories.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No event histories available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {histories.map((history) => (
              <div key={history._id} className="relative">
                <button
                  onClick={() => setSelectedHistory(history)}
                  className={`w-full p-2 rounded-lg border-2 transition-colors ${
                    selectedHistory?._id === history._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{history.snapshotName}</div>
                </button>
                {isEditMode && (
                  <button
  onClick={() => handleDelete(history._id)}
  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
>
  <Trash2 className="w-4 h-4" />
</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Tabs */}
      {selectedHistory && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-2 py-2 rounded-md font-semibold flex items-center ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Stats
            </button>

            <button
              onClick={() => setActiveTab('income')}
              className={`px-2 py-2 rounded-md font-semibold flex items-center ${
                activeTab === 'income'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Income
            </button>

            <button
              onClick={() => setActiveTab('expense')}
              className={`px-2 py-2 rounded-md font-semibold flex items-center ${
                activeTab === 'expense'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Expenses
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`px-2 py-2 rounded-md font-semibold flex items-center ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CalendarDays className="h-4 w-4 mr-0" />
              
            </button>
          </div>

          {/* Search and Filters for Income/Expense */}
          {(activeTab === 'income' || activeTab === 'expense') && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="form-select"
                >
                  <option value="">Sort</option>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>

                {activeTab === 'income' && (
                  <>
                    <select
                      value={filters.belongsTo}
                      onChange={(e) => setFilters({ ...filters, belongsTo: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Belongs To</option>
                      <option value="villagers">Villagers</option>
                      <option value="youth">Youth</option>
                    </select>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showBelongsTo}
                        onChange={(e) => setShowBelongsTo(e.target.checked)}
                      />
                      <span className="text-sm"></span>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'stats' && (
              <HistoryStats 
                stats={getCurrentData()} 
                snapshotName={selectedHistory.snapshotName}
              />
            )}
            {activeTab === 'income' && (
              <HistoryIncome 
                incomes={filteredData()} 
                snapshotName={selectedHistory.snapshotName}
                showBelongsTo={showBelongsTo}
              />
            )}
            {activeTab === 'expense' && (
              <HistoryExpense 
                expenses={filteredData()} 
                snapshotName={selectedHistory.snapshotName}
              />
            )}
            {activeTab === 'events' && (
              <HistoryEvents 
                events={getCurrentData()} 
                snapshotName={selectedHistory.snapshotName}
              />
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <HistoryForm
          snapshots={snapshots}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      
    </div>
  );
}

export default Histories;