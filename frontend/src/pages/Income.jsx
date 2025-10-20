import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import IncomeTable from '../components/income/IncomeTable';
import IncomeFilters from '../components/income/IncomeFilters';
import IncomeForm from '../components/income/IncomeForm';
import EnglishPrint from '../components/income/IncomeEnglishPrint';
import TeluguPrint from '../components/income/IncomeTeluguPrint';
import { API_URL } from '../utils/config';
import { useLanguage } from '../context/LanguageContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

function Income() {
  const { user } = useAuth();
  const { lockSettings } = useLockSettings();
  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMode: '',
    belongsTo: '',
    verifyLog: '',
    sort: '',
    startDate: '',
    endDate: '',
    dateFilter: 'entryDate'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    incomeId: false,
    registerId: false,
    entryDate: false,
    paidDate: false,
    name: true,
  //email: false,
  //phoneNumber: false,
    amount: true,
    status: true,
    paymentMode: false,
    belongsTo: false,
    verifyLog: false,
  });
  const [showForm, setShowForm] = useState(false);
  const [hiddenProfiles, setHiddenProfiles] = useState(new Set());
  const [editingIncome, setEditingIncome] = useState(null);
  const { language } = useLanguage();
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;

  useEffect(() => {
    fetchIncomes();
  }, [search, filters]);

  const fetchIncomes = async () => {
    try {
      const params = new URLSearchParams({
        search,
        ...filters
      });
      const { data } = await axios.get(`${API_URL}/api/incomes?${params}`);
      
      // Sort the data if sort filter is applied
      if (filters.sort) {
        data.sort((a, b) => {
          if (filters.sort === 'desc') {
            return b.amount - a.amount;
          }
          return a.amount - b.amount;
        });
      }
      
      setIncomes(data);
    } catch (error) {
      toast.error('Failed to fetch incomes');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handlePrivacyToggle = (incomeId) => {
    if (!['developer', 'financier'].includes(user?.role)) return;

    setHiddenProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(incomeId)) {
        newSet.delete(incomeId);
      } else {
        newSet.add(incomeId);
      }
      return newSet;
    });
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (incomeId) => {
    if (user?.role === 'admin') return;

    if (!window.confirm('Are you sure you want to move this item to recycle bin?')) return;

    try {
      await axios.delete(`${API_URL}/api/incomes/${incomeId}`);
      toast.success('Income moved to recycle bin');
      fetchIncomes();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };


return (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Income</h1>

        <div className="flex items-center space-x-3">
          {['developer', 'admin', 'financier'].includes(user?.role) && (
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={lockSettings.isLocked} // disabled if locked
              className={`btn-secondary flex items-center ${
                lockSettings.isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={lockSettings.isLocked ? 'Locked - cannot add' : ''}
            >
              <Plus className="h-4 w-4 mr-1 inline" />
              Add
            </button>
          )}
          <PrintComponent incomes={incomes} visibleColumns={visibleColumns} />
        </div>
      </div>

      {/* Below heading: lock indicator + event label side by side */}
      <div className="flex items-center">
        <LockIndicator />
        <EventLabelDisplay />
      </div>
    </div>

    {/* Search and filters */}
    <div className="space-y-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, name, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>
      </div>
      <IncomeFilters
        filters={filters}
        visibleColumns={visibleColumns}
        onChange={handleFilterChange}
        onColumnToggle={handleColumnToggle}
      />
    </div>

    <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Visible Columns</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(visibleColumns).map(([column, isVisible]) => {
              // Check visibility for specific columns based on user role
              if (
                (column === 'registerId' && !['developer', 'financier'].includes(user?.role)) ||
                (column === 'email' && !['admin', 'developer', 'financier'].includes(user?.role)) ||
                (column === 'phoneNumber' && !['admin', 'developer', 'financier'].includes(user?.role))
              ) {
                return null;
              }
              return (
                <label key={column} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleColumnToggle(column)}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm">{column}</span>
                </label>
              );
            })}
          </div>
        </div>

      <IncomeTable
        incomes={incomes}
        visibleColumns={visibleColumns}
        hiddenProfiles={hiddenProfiles}
        onPrivacyToggle={handlePrivacyToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isPrivilegedUser={true}
        userRole={user?.role}
        isLocked={lockSettings.isLocked}
      />
    </div>

    {showForm && !lockSettings.isLocked && (
      <IncomeForm
        income={editingIncome}
        onClose={() => {
          setShowForm(false);
          setEditingIncome(null);
        }}
        onSuccess={() => {
          fetchIncomes();
          setShowForm(false);
          setEditingIncome(null);
        }}
      />
    )}
  </div>
);
}

export default Income;
