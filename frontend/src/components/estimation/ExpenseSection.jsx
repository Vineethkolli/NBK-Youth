import { useState, useEffect } from 'react';
import { Filter, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import EstimatedExpenseTable from "./ExpenseTable"; 
import EstimationForm from './Form';
import ExpensePrint from './ExpensePrint'; 

function ExpenseSection({ refreshStats }) {
  const [expenses, setExpenses] = useState([]);
  const [expenseFilters, setExpenseFilters] = useState({
    sortField: 'presentAmount',
    sortOrder: ''
  });
  const [expenseColumns, setExpenseColumns] = useState({
    sno: true,
    purpose: true,
    previousAmount: false,
    presentAmount: true,
    others: false
  });

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); 
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [expenseFilters]);

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/estimation/expense`, {
        params: expenseFilters
      });
      
      // Apply client-side sorting if sortOrder is provided
      let sortedData = data;
      if (expenseFilters.sortOrder) {
        const { sortField, sortOrder } = expenseFilters;
        sortedData = [...data].sort((a, b) => {
          // Convert values to numbers; fallback to 0 if conversion fails
          const aValue = Number(a[sortField]) || 0;
          const bValue = Number(b[sortField]) || 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }
      
      setExpenses(sortedData);
    } catch (error) {
      toast.error('Failed to fetch expense data');
    }
  };

  const handleExpenseDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`${API_URL}/api/estimation/expense/${id}`);
      setExpenses(expenses.filter(expense => expense._id !== id));
      if (refreshStats) refreshStats();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleAdd = () => {
    setFormMode('add');
    setCurrentRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record) => {
    setFormMode('edit');
    setCurrentRecord(record);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (formMode === 'add') {
        const { data } = await axios.post(`${API_URL}/api/estimation/expense`, formData);
        setExpenses([data, ...expenses]);
      } else if (formMode === 'edit') {
        const { data } = await axios.put(`${API_URL}/api/estimation/expense/${currentRecord._id}`, formData);
        setExpenses(expenses.map(expense => expense._id === currentRecord._id ? data : expense));
      }
      setShowForm(false);
      fetchExpenses();
      if (refreshStats) refreshStats();
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={expenseFilters.sortOrder}
            onChange={(e) => setExpenseFilters({ ...expenseFilters, sortOrder: e.target.value })}
            className="form-select"
          >
            <option value="">Sort</option>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
          {/* Print button */}
          <ExpensePrint expenses={expenses} visibleColumns={expenseColumns} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Visible Columns</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(expenseColumns).map(([column, isVisible]) => (
              <label key={column} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => setExpenseColumns({ ...expenseColumns, [column]: !isVisible })}
                  className="form-checkbox"
                />
                <span className="ml-2 text-sm">{column}</span>
              </label>
            ))}
          </div>
        </div>

        <EstimatedExpenseTable
          expenses={expenses}
          visibleColumns={expenseColumns}
          onEdit={handleEdit}
          onDelete={handleExpenseDelete}
        />
      </div>

      {showForm && (
        <EstimationForm
          type="expense"
          mode={formMode}
          data={currentRecord}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default ExpenseSection;
