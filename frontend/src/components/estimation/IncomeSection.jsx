import { useState, useEffect } from 'react';
import { Filter, Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import EstimatedIncomeTable from './IncomeTable';
import EstimationForm from './Form';
import IncomePrint from './IncomePrint';
import IncomeTeluguPrint from './IncomeTeluguPrint';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

function IncomeSection({ refreshStats }) {
  const { language } = useLanguage();
  const PrintComponent = language === 'te' ? IncomeTeluguPrint : IncomePrint;

  const { hasAccess, user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState('');
  const [incomeFilters, setIncomeFilters] = useState({
    status: '',
    belongsTo: '',
    sortField: 'presentAmount',
    sortOrder: ''
  });

  const [incomeColumns, setIncomeColumns] = useState({
    sno: true,
    registerId: false,
    name: true,
    previousAmount: false,
    presentAmount: true,
    belongsTo: false,
    status: false,
    others: false
  });

  useEffect(() => {
    if (hasAccess('Privileged')){
      setIncomeColumns(prev => ({ ...prev, registerId: false }));
    }
  }, [user?.role]);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    fetchIncomes();
  }, [incomeFilters, search]);

  const fetchIncomes = async () => {
    try {
      const params = { ...incomeFilters, search };
      const { data } = await axios.get(`${API_URL}/api/estimation/income`, { params });
      setIncomes(data);
    } catch (error) {
      toast.error('Failed to fetch income data');
    }
  };

  const handleIncomeDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income?")) return;
    try {
      await axios.delete(`${API_URL}/api/estimation/income/${id}`);
      setIncomes(incomes.filter(income => income._id !== id));
      toast.success('Income deleted successfully');
      if (refreshStats) refreshStats();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  const handleAdd = () => { setFormMode('add'); setCurrentRecord(null); setShowForm(true); };
  const handleEdit = (record) => { setFormMode('edit'); setCurrentRecord(record); setShowForm(true); };

  const handleFormSubmit = async (formData) => {
    try {
      const payload = { ...formData, registerId: user?.registerId };
      let data;
      if (formMode === 'add') {
        ({ data } = await axios.post(`${API_URL}/api/estimation/income`, payload));
        setIncomes([data, ...incomes]);
        toast.success('Income added successfully');
      } else if (formMode === 'edit') {
        ({ data } = await axios.put(`${API_URL}/api/estimation/income/${currentRecord._id}`, payload));
        setIncomes(incomes.map(i => i._id === currentRecord._id ? data : i));
        toast.success('Income updated successfully');
      }
      setShowForm(false);
      fetchIncomes();
      if (refreshStats) refreshStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit form');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, present amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-1 w-full border rounded-lg"
          />
        </div>

        <div className="flex items-center space-x-3">
          {hasAccess('Privileged') && (
            <button onClick={handleAdd} className="btn-secondary flex items-center">
              <Plus className="h-4 w-4 mr-1 inline" />
              Add
            </button>
          )}
          <PrintComponent incomes={incomes} visibleColumns={incomeColumns} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={incomeFilters.sortOrder}
          onChange={(e) => setIncomeFilters({ ...incomeFilters, sortOrder: e.target.value })}
          className="form-select"
        >
          <option value="">Sort</option>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <select
          value={incomeFilters.belongsTo}
          onChange={(e) => setIncomeFilters({ ...incomeFilters, belongsTo: e.target.value })}
          className="form-select"
        >
          <option value="">Belongs To</option>
          <option value="youth">Youth</option>
          <option value="villagers">Villagers</option>
        </select>
        <select
          value={incomeFilters.status}
          onChange={(e) => setIncomeFilters({ ...incomeFilters, status: e.target.value })}
          className="form-select"
        >
          <option value="">Status</option>
          <option value="paid">Paid</option>
          <option value="not paid">Not Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Visible Columns</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(incomeColumns).map(([column, isVisible]) => {
              if (column === 'sno') return null;
              if (column === 'registerId' && !hasAccess('Privileged')) return null;
              return (
                <label key={column} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => setIncomeColumns({ ...incomeColumns, [column]: !isVisible })}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm">{column}</span>
                </label>
              );
            })}
          </div>
        </div>

        <EstimatedIncomeTable
          incomes={incomes}
          visibleColumns={incomeColumns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleIncomeDelete}
        />
      </div>

      {showForm && (
        <EstimationForm
          type="income"
          mode={formMode}
          data={currentRecord}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default IncomeSection;
