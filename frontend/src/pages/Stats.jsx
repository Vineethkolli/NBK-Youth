import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Users, Edit2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';

function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    budgetStats: {
      totalIncome: { count: 0, amount: 0 },
      amountReceived: { count: 0, amount: 0 },
      amountPending: { count: 0, amount: 0 },
      totalExpenses: { count: 0, amount: 0 },
      previousYearAmount: { amount: 0 },
      amountLeft: { amount: 0 },
      online: { count: 0, amount: 0 },
      offline: { count: 0, amount: 0 }
    },
    userStats: {
      totalUsers: 0,
      onlinePayments: 0
    },
    villagers: {
      paid: { cash: 0, online: 0, webApp: 0, total: 0 },
      pending: { cash: 0, online: 0, webApp: 0, total: 0 },
      total: 0
    },
    youth: {
      paid: { cash: 0, online: 0, webApp: 0, total: 0 },
      pending: { cash: 0, online: 0, webApp: 0, total: 0 },
      total: 0
    }
  });

  const [isEditingPreviousYear, setIsEditingPreviousYear] = useState(false);
  const [previousYearAmount, setPreviousYearAmount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/stats`);
      setStats(data);
      setPreviousYearAmount(data.budgetStats.previousYearAmount.amount);
    } catch (error) {
      toast.error('Failed to fetch stats');
    }
  };

  const handlePreviousYearUpdate = async () => {
    try {
      await axios.patch(`${API_URL}/api/stats/previous-year`, {
        amount: previousYearAmount
      });
      toast.success('Previous year amount updated');
      setIsEditingPreviousYear(false);
      fetchStats();
    } catch (error) {
      toast.error('Failed to update previous year amount');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" /> Budget Stats
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="font-semibold">{stats.budgetStats.totalIncome.count} entries</p>
                <p className="text-lg font-bold">{formatAmount(stats.budgetStats.totalIncome.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Received</p>
                <p className="font-semibold">{stats.budgetStats.amountReceived.count} entries</p>
                <p className="text-lg font-bold text-green-600">{formatAmount(stats.budgetStats.amountReceived.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Pending</p>
                <p className="font-semibold">{stats.budgetStats.amountPending.count} entries</p>
                <p className="text-lg font-bold text-red-600">{formatAmount(stats.budgetStats.amountPending.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="font-semibold">{stats.budgetStats.totalExpenses.count} entries</p>
                <p className="text-lg font-bold text-red-600">{formatAmount(stats.budgetStats.totalExpenses.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Previous Year Amount</p>
                {(user?.role === 'developer' || user?.role === 'financier') && isEditingPreviousYear ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={previousYearAmount}
                      onChange={(e) => setPreviousYearAmount(Number(e.target.value))}
                      className="w-full rounded border-gray-300"
                    />
                    <button
                      onClick={handlePreviousYearUpdate}
                      className="px-2 py-1 bg-green-500 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold">{formatAmount(stats.budgetStats.previousYearAmount.amount)}</p>
                    {(user?.role === 'developer' || user?.role === 'financier') && (
                      <button
                        onClick={() => setIsEditingPreviousYear(true)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Left <span className="text-gray-500">(excluding previous year amount)</span>
                </p>
                <p className="text-lg font-bold">{formatAmount(stats.budgetStats.amountLeft.amount)}</p>
                <div className="text-sm">
                  <p>Online: {formatAmount(stats.budgetStats.online.amount)}</p>
                  <p>Offline: {formatAmount(stats.budgetStats.offline.amount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2" /> User Stats
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-lg font-bold">{stats.userStats.totalUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Online Payments</p>
              <p className="text-lg font-bold">{stats.userStats.onlinePayments}</p>
            </div>
          </div>
        </div>

        {/* Villagers Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Villagers</h2>
          <div className="mb-4">
            <p className="text-lg font-bold">Total Amount: {formatAmount(stats.villagers.total)}</p>
          </div>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">Status</th>
                <th className="text-right">Cash</th>
                <th className="text-right">Online</th>
                <th className="text-right">Web App</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paid</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.cash)}</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.online)}</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.webApp)}</td>
                <td className="text-right font-bold">{formatAmount(stats.villagers.paid.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.cash)}</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.online)}</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.webApp)}</td>
                <td className="text-right font-bold">{formatAmount(stats.villagers.pending.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Youth Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Youth</h2>
          <div className="mb-4">
            <p className="text-lg font-bold">Total Amount: {formatAmount(stats.youth.total)}</p>
          </div>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">Status</th>
                <th className="text-right">Cash</th>
                <th className="text-right">Online</th>
                <th className="text-right">Web App</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paid</td>
                <td className="text-right">{formatAmount(stats.youth.paid.cash)}</td>
                <td className="text-right">{formatAmount(stats.youth.paid.online)}</td>
                <td className="text-right">{formatAmount(stats.youth.paid.webApp)}</td>
                <td className="text-right font-bold">{formatAmount(stats.youth.paid.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.youth.pending.cash)}</td>
                <td className="text-right">{formatAmount(stats.youth.pending.online)}</td>
                <td className="text-right">{formatAmount(stats.youth.pending.webApp)}</td>
                <td className="text-right font-bold">{formatAmount(stats.youth.pending.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Stats;