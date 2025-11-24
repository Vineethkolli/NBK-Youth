import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, RefreshCw,  IndianRupee, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { formatDateTime } from '../utils/dateTime';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

function RecycleBin() {
  const { hasAccess } = useAuth();
  const { lockSettings } = useLockSettings();
  const [deletedIncomes, setDeletedIncomes] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);
  const [loadingRestoreIncomeId, setLoadingRestoreIncomeId] = useState(null);
  const [loadingDeleteIncomeId, setLoadingDeleteIncomeId] = useState(null);
  const [loadingRestoreExpenseId, setLoadingRestoreExpenseId] = useState(null);
  const [loadingDeleteExpenseId, setLoadingDeleteExpenseId] = useState(null);

  const [activeBin, setActiveBin] = useState('income'); 
  
  if (!hasAccess('Pro'))  {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const [incomesResponse, expensesResponse] = await Promise.all([
        api.get(`/api/incomes/recycle-bin`),
        api.get(`/api/expenses/recycle-bin`),
      ]);
      setDeletedIncomes(incomesResponse.data);
      setDeletedExpenses(expensesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch deleted items');
    }
  };

  const handleRestoreIncome = async (id) => {
  if (!window.confirm('Are you sure you want to restore this income?')) return;
  setLoadingRestoreIncomeId(id);
  try {
    await api.post(`/api/incomes/restore/${id}`);
    toast.success('Income restored successfully');
    fetchDeletedItems();
  } catch {
    toast.error('Failed to restore income');
  } finally {
    setLoadingRestoreIncomeId(null);
  }
};

const handlePermanentDeleteIncome = async (id) => {
  if (!window.confirm('Are you sure you want to permanently delete this income?')) return;
  setLoadingDeleteIncomeId(id);
  try {
    await api.delete(`/api/incomes/permanent/${id}`);
    toast.success('Income permanently deleted');
    fetchDeletedItems();
  } catch {
    toast.error('Failed to delete income permanently');
  } finally {
    setLoadingDeleteIncomeId(null);
  }
};

  const handleRestoreExpense = async (id) => {
  if (!window.confirm('Are you sure you want to restore this expense?')) return;
  setLoadingRestoreExpenseId(id);
  try {
    await api.post(`/api/expenses/restore/${id}`);
    toast.success('Expense restored successfully');
    fetchDeletedItems();
  } catch {
    toast.error('Failed to restore expense');
  } finally {
    setLoadingRestoreExpenseId(null);
  }
};

const handlePermanentDeleteExpense = async (id) => {
  if (!window.confirm('Are you sure you want to permanently delete this expense?')) return;
  setLoadingDeleteExpenseId(id);
  try {
    await api.delete(`/api/expenses/permanent/${id}`);
    toast.success('Expense permanently deleted');
    fetchDeletedItems();
  } catch {
    toast.error('Failed to delete expense permanently');
  } finally {
    setLoadingDeleteExpenseId(null);
  }
};


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold mb-2 lg:mb-0">Recycle Bin</h1>
          <div className="flex items-center mb-6 lg:mb-0 ">
            <LockIndicator />
            <EventLabelDisplay />
          </div>

          <div className="flex space-x-6">
  <button
    onClick={() => setActiveBin('income')}
    className={`px-4 py-2 rounded-md font-semibold flex items-center space-x-2 ${
      activeBin === 'income'
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    <IndianRupee size={18} />
    <span>Income</span>
  </button>

  <button
    onClick={() => setActiveBin('expense')}
    className={`px-4 py-2 rounded-md font-semibold flex items-center space-x-2 ${
      activeBin === 'expense'
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    <DollarSign size={18} />
    <span>Expense</span>
  </button>
</div>
        </div>
      </div>

      {/* Income Bin Table */}
      {activeBin === 'income' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {deletedIncomes.map((item) => {
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.incomeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.registerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(item.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.paidDate ? formatDateTime(item.paidDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                          item.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.belongsTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.verifyLog}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(item.deletedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div
                        className={`flex space-x-3 ${
                          lockSettings.isLocked ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <button
  onClick={() => handleRestoreIncome(item._id)}
  disabled={loadingRestoreIncomeId === item._id || lockSettings.isLocked}
  className={`text-indigo-600 hover:text-indigo-900 ${
    loadingRestoreIncomeId === item._id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  title={lockSettings.isLocked ? 'Locked - cannot restore' : 'Restore'}
>
  {loadingRestoreIncomeId === item._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
</button>

<button
  onClick={() => handlePermanentDeleteIncome(item._id)}
  disabled={loadingDeleteIncomeId === item._id || lockSettings.isLocked}
  className={`text-red-600 hover:text-red-900 ${
    loadingDeleteIncomeId === item._id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  title={lockSettings.isLocked ? 'Locked - cannot delete' : 'Delete permanently'}
>
  {loadingDeleteIncomeId === item._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Bin Table */}
      {activeBin === 'expense' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {deletedExpenses.map((item) => {
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.expenseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.registerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(item.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{item.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.billImage ? (
                        <a
                          href={item.billImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          View Bill
                        </a>
                      ) : (
                        'No Image'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.verifyLog}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(item.deletedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div
                        className={`flex space-x-3 ${
                          lockSettings.isLocked ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <button
  onClick={() => handleRestoreExpense(item._id)}
  disabled={loadingRestoreExpenseId === item._id || lockSettings.isLocked}
  className={`text-indigo-600 hover:text-indigo-900 ${
    loadingRestoreExpenseId === item._id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  title={lockSettings.isLocked ? 'Locked - cannot restore' : 'Restore'}
>
  {loadingRestoreExpenseId === item._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
</button>

<button
  onClick={() => handlePermanentDeleteExpense(item._id)}
  disabled={loadingDeleteExpenseId === item._id || lockSettings.isLocked}
  className={`text-red-600 hover:text-red-900 ${
    loadingDeleteExpenseId === item._id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  title={lockSettings.isLocked ? 'Locked - cannot delete' : 'Delete permanently'}
>
  {loadingDeleteExpenseId === item._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecycleBin;
