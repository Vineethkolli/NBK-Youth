import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, ChevronRight, ChevronDown, Filter, Columns } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import IncomeTable from '../components/income/IncomeTable';
import IncomeFilters from '../components/income/IncomeFilters';
import IncomeForm from '../components/income/IncomeForm';
import EnglishPrint from '../components/income/IncomeEnglishPrint';
import TeluguPrint from '../components/income/IncomeTeluguPrint';
import { useLanguage } from '../context/LanguageContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

function Income() {
  const { hasAccess } = useAuth();
  const { lockSettings } = useLockSettings();
  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState('');
  const [openPanel, setOpenPanel] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    paymentMode: '',
    belongsTo: '',
    verifyLog: '',
    sort: '',
    startDate: '',
    endDate: '',
    dateFilter: 'entryDate',
  });

  const [visibleColumns, setVisibleColumns] = useState({
    incomeId: false,
    registerId: false,
    entryDate: false,
    paidDate: false,
    name: true,
    amount: true,
    status: true,
    paymentMode: false,
    belongsTo: false,
    verifyLog: false,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const { language } = useLanguage();
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;

  useEffect(() => {
    fetchIncomes();
  }, [search, filters]);

  const fetchIncomes = async () => {
    try {
      const params = new URLSearchParams({ search, ...filters });
      const { data } = await api.get(`/api/incomes?${params}`);

      if (filters.sort) {
        data.sort((a, b) =>
          filters.sort === 'desc' ? b.amount - a.amount : a.amount - b.amount
        );
      }

      setIncomes(data);
    } catch {
      toast.error('Failed to fetch incomes');
    }
  };

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (incomeId) => {
    if (!window.confirm('Are you sure you want to move this item to recycle bin?')) return;

    try {
      await api.delete(`/api/incomes/${incomeId}`);
      toast.success('Income moved to recycle bin');
      fetchIncomes();
    } catch {
      toast.error('Failed to delete income');
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Income</h1>

          <div className="flex items-center space-x-3">
            {hasAccess('Privileged') && (
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

            <PrintComponent incomes={incomes} visibleColumns={visibleColumns} />
          </div>
        </div>

        <div className="flex items-center">
          <LockIndicator />
          <EventLabelDisplay />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, name, amount..."
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
    {openPanel === "filters" ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronRight className="h-4 w-4" />
    )}
  </button>

  <button
    onClick={() => setOpenPanel(openPanel === "columns" ? null : "columns")}
    className="flex items-center gap-3 px-3 py-1 bg-white rounded-md shadow border"
  >
    <span className="font-medium flex items-center gap-2">
      <Columns className="h-4 w-4 text-gray-600" />
      Columns
    </span>
    {openPanel === "columns" ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronRight className="h-4 w-4" />
    )}
  </button>
</div>

        {openPanel === "filters" && (
          <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
            <IncomeFilters
              filters={filters}
              visibleColumns={visibleColumns}
              onChange={handleFilterChange}
              onColumnToggle={handleColumnToggle}
            />
          </div>
        )}

        {openPanel === "columns" && (
          <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {Object.entries(visibleColumns).map(([column, isVisible]) => {
                if (
                  ['registerId', 'email', 'phoneNumber'].includes(column) &&
                  !hasAccess('Privileged')
                ) return null;

                return (
                  <label key={column} className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleColumnToggle(column)}
                      className="form-checkbox"
                    />
                    <span className="ml-2 capitalize">{column}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <IncomeTable
          incomes={incomes}
          visibleColumns={visibleColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
