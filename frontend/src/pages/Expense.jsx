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
  const { user, hasAccess } = useAuth();
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
    verifyLog: false
  });

  const [showForm, setShowForm] = useState(false);
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

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (!hasAccess('Pro')) return;
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Expense</h1>

          <div className="flex items-center space-x-3">
            {hasAccess('Pro') && (
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

        <div className="flex items-center">
          <LockIndicator />
          <EventLabelDisplay />
        </div>
      </div>

      {/* Search and Filters */}
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

      {/* Visible Columns */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Visible Columns</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(visibleColumns).map(([column, isVisible]) => {
              if (['registerId', 'phoneNumber'].includes(column) && !hasAccess('Privileged')) return null;
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

        <ExpenseTable
          expenses={expenses}
          visibleColumns={visibleColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          userRole={user?.role}
          isLocked={lockSettings.isLocked}
        />
      </div>

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
