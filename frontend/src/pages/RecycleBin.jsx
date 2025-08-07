import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { formatDateTime } from '../utils/dateTime';

function RecycleBin() {
  const [deletedIncomes, setDeletedIncomes] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const [incomesResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/incomes/recycle-bin`),
        axios.get(`${API_URL}/api/expenses/recycle-bin`)
      ]);
      setDeletedIncomes(incomesResponse.data);
      setDeletedExpenses(expensesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch deleted items');
    }
  };

  const handleRestoreIncome = async (id) => {
    try {
      await axios.post(`${API_URL}/api/incomes/restore/${id}`);
      toast.success('Income restored successfully');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to restore income');
    }
  };

  const handlePermanentDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone!')) return;
    try {
      await axios.delete(`${API_URL}/api/incomes/permanent/${id}`);
      toast.success('Income permanently deleted');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to delete income permanently');
    }
  };

  const handleRestoreExpense = async (id) => {
    try {
      await axios.post(`${API_URL}/api/expenses/restore/${id}`);
      toast.success('Expense restored successfully');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to restore expense');
    }
  };

  const handlePermanentDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone!')) return;
    try {
      await axios.delete(`${API_URL}/api/expenses/permanent/${id}`);
      toast.success('Expense permanently deleted');
      fetchDeletedItems();
    } catch (error) {
      toast.error('Failed to delete expense permanently');
    }
  };


  return (
    <div className="space-y-8 p-0">
      {/* Income Bin */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Income Bin</h1>
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
              {deletedIncomes.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.incomeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.belongsTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.verifyLog}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(item.deletedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRestoreIncome(item._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteIncome(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Bin */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Expense Bin</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Purposes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Amounts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Returned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image Bill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deletedExpenses.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.expenseId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.purpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ul className="list-disc list-inside">
                      {item.subExpenses.map((sub, idx) => (
                        <li key={idx}>{sub.subPurpose}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ul className="list-inside">
                      {item.subExpenses.map((sub, idx) => (
                        <li key={idx}>{sub.subAmount}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amountReturned || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
              {item.subExpenses && item.subExpenses.some(sub => typeof sub.billImage === 'string' && sub.billImage.includes('cloudinary.com')) ? (
                <div className="flex flex-wrap">
                  {item.subExpenses.map((sub, idx) => (
                    typeof sub.billImage === 'string' && sub.billImage.includes('cloudinary.com') ? (
                      <a
                        key={idx}
                        href={sub.billImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Bill
                      </a>
                    ) : null
                  ))}
                </div>
              ) : (
                'No Image'
              )}
            </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.verifyLog}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(item.deletedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRestoreExpense(item._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteExpense(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RecycleBin;