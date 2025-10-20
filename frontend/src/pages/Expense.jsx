import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import ExpenseTable from '../components/expense/ExpenseTable';
import ExpenseFilters from '../components/expense/ExpenseFilters';
import ExpenseForm from '../components/expense/ExpenseForm';
import EnglishPrint from '../components/expense/ExpenseEnglishPrint';
import TeluguPrint from '../components/expense/ExpenseTeluguPrint';
import { API_URL } from '../utils/config';
import { useLanguage } from '../context/LanguageContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

function Expense() {
  const { user } = useAuth();
  const { lockSettings } = useLockSettings();
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    paymentMode: '',
    verifyLog: '',
    sort: '',
    startDate: '',
    endDate: ''
  });
  const [visibleColumns, setVisibleColumns] = useState({
    expenseId: false,
    registerId: false,
    dateTime: false,
    purpose: true,
    amount: true,
    paymentMode: false,
    bill: false,
    name: false,
  //phoneNumber: false,
    verifyLog: false
  });

  const [showForm, setShowForm] = useState(false);
  const [hiddenProfiles, setHiddenProfiles] = useState(new Set());
  const [editingExpense, setEditingExpense] = useState(null);
  const { language } = useLanguage();
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;

  useEffect(() => {
    fetchExpenses();
  }, [search, filters]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams({
        search,
        ...filters
      });
      const { data } = await axios.get(`${API_URL}/api/expenses?${params}`);

      if (filters.sort) {
        data.sort((a, b) => (filters.sort === 'desc' ? b.amount - a.amount : a.amount - b.amount));
      }

      setExpenses(data);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    }
  };

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handlePrivacyToggle = (expenseId) => {
    if (!['developer', 'financier'].includes(user?.role)) return;

    setHiddenProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (!['developer', 'financier'].includes(user?.role)) return;
    if (!window.confirm('Are you sure you want to move this item to recycle bin?')) return;
    try {
      await axios.delete(`${API_URL}/api/expenses/${expenseId}`);
      toast.success('Expense moved to recycle bin');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

return (
  <div className="space-y-6">
    <div className="space-y-2">
      {/* Top row */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Expense</h1>

        <div className="flex items-center space-x-3">
          {['developer', 'financier'].includes(user?.role) && (
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={lockSettings.isLocked}
              className={`btn-secondary flex items-center ${
                lockSettings.isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={lockSettings.isLocked ? 'Locked - cannot add' : ''}
            >
              <Plus className="h-4 w-4 mr-1 inline" />
              Add
            </button>
          )}
          <PrintComponent expenses={expenses} visibleColumns={visibleColumns} />
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, name, amount, purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-lg"
        />
      </div>

      <ExpenseFilters
        filters={filters}
        visibleColumns={visibleColumns}
        onChange={handleFilterChange}
        onColumnToggle={handleColumnToggle}
      />
    </div>

    {/* Visible Columns toggles */}
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="font-medium">Visible Columns</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(visibleColumns).map(([column, isVisible]) => {
            if (column === 'registerId' && !['developer', 'financier'].includes(user?.role))
              return null;
            if (
              column === 'phoneNumber' &&
              !['admin', 'developer', 'financier'].includes(user?.role)
            )
              return null;
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

      {/* Expense Table */}
      <ExpenseTable
        expenses={expenses}
        visibleColumns={visibleColumns}
        hiddenProfiles={hiddenProfiles}
        onPrivacyToggle={handlePrivacyToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isPrivilegedUser={['developer', 'financier'].includes(user?.role)}
        userRole={user?.role}
        isLocked={lockSettings.isLocked}
      />
    </div>

    {/* Expense Form modal */}
    {showForm && !lockSettings.isLocked && (
      <ExpenseForm
        expense={editingExpense}
        onClose={() => {
          setShowForm(false);
          setEditingExpense(null);
        }}
        onSuccess={() => {
          fetchExpenses();
          setShowForm(false);
          setEditingExpense(null);
        }}
      />
    )}
  </div>
);

}

export default Expense;
