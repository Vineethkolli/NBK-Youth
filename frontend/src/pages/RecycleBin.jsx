import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { formatDateTime } from '../utils/dateTime';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

function RecycleBin() {
  const { lockSettings } = useLockSettings();
  const [deletedIncomes, setDeletedIncomes] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);
  const [loadingIncomeId, setLoadingIncomeId] = useState(null);
  const [loadingExpenseId, setLoadingExpenseId] = useState(null);

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const [incomesResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/incomes/recycle-bin`),
        axios.get(`${API_URL}/api/expenses/recycle-bin`),
      ]);
      setDeletedIncomes(incomesResponse.data);
      setDeletedExpenses(expensesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch deleted items');
    }
  };

  const handleRestoreIncome = async (id) => {
    setLoadingIncomeId(id);
    try {
      await axios.post(`${API_URL}/api/incomes/restore/${id}`);
      toast.success('Income restored successfully');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to restore income');
    } finally {
      setLoadingIncomeId(null);
    }
  };

  const handlePermanentDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone!')) return;
    setLoadingIncomeId(id);
    try {
      await axios.delete(`${API_URL}/api/incomes/permanent/${id}`);
      toast.success('Income permanently deleted');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to delete income permanently');
    } finally {
      setLoadingIncomeId(null);
    }
  };

  const handleRestoreExpense = async (id) => {
    setLoadingExpenseId(id);
    try {
      await axios.post(`${API_URL}/api/expenses/restore/${id}`);
      toast.success('Expense restored successfully');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to restore expense');
    } finally {
      setLoadingExpenseId(null);
    }
  };

  const handlePermanentDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone!')) return;
    setLoadingExpenseId(id);
    try {
      await axios.delete(`${API_URL}/api/expenses/permanent/${id}`);
      toast.success('Expense permanently deleted');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to delete expense permanently');
    } finally {
      setLoadingExpenseId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recycle Bin</h1>
      </div>

    <div className="flex items-center">
        <LockIndicator />
        <EventLabelDisplay />
      </div>
      </div>
      {/* Income Bin */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Income Bin</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
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
                const isLoading = loadingIncomeId === item._id;
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.incomeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
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
                          disabled={isLoading || lockSettings.isLocked}
                          className={`text-indigo-600 hover:text-indigo-900 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={lockSettings.isLocked ? 'Locked - cannot restore' : 'Restore'}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handlePermanentDeleteIncome(item._id)}
                          disabled={isLoading || lockSettings.isLocked}
                          className={`text-red-600 hover:text-red-900 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={lockSettings.isLocked ? 'Locked - cannot delete' : 'Delete permanently'}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Bin */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Expense Bin</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
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
                const isLoading = loadingExpenseId === item._id;
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.expenseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.billImage ? (
                        <a
                          href={item.billImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
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
                          disabled={isLoading || lockSettings.isLocked}
                          className={`text-indigo-600 hover:text-indigo-900 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={lockSettings.isLocked ? 'Locked - cannot restore' : 'Restore'}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handlePermanentDeleteExpense(item._id)}
                          disabled={isLoading || lockSettings.isLocked}
                          className={`text-red-600 hover:text-red-900 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={lockSettings.isLocked ? 'Locked - cannot delete' : 'Delete permanently'}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RecycleBin;
