import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Users, Edit2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import Footer from '../components/Footer';
import TeluguPrint from '../components/stats/StatsTeluguPrint';
import EnglishPrint from '../components/stats/StatsEnglishPrint';
import { useLanguage } from '../context/LanguageContext';

function Stats() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;
  const [stats, setStats] = useState({
    budgetStats: {
      totalIncome: { count: 0, amount: 0 },
      amountReceived: { count: 0, amount: 0 },
      amountPending: { count: 0, amount: 0 },
      totalExpenses: { count: 0, amount: 0, onlineAmount: 0, cashAmount: 0 },
      previousYearAmount: { amount: 0 },
      amountLeft: { amount: 0, onlineAmount: 0, cashAmount: 0 },
      online: { count: 0, amount: 0 },
      offline: { count: 0, amount: 0 }
    },
    userStats: {
      totalUsers: 0,
      successfulPayments: 0
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

  // Helper function to wrap content to avoid translation
  const noTranslate = (value) => {
    return <span translate="no" className="notranslate">{value}</span>;
  };

  // Wrap currency values in a noTranslate span
  const formatAmount = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return noTranslate(formatted);
  };

  // Wrap plain numbers in a noTranslate span
  const formatNumber = (num) => {
    return noTranslate(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <PrintComponent stats={stats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" /> Budget Stats
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Total Income</p>
                <p className="text-sm text-gray-600">
                  {formatNumber(stats.budgetStats.totalIncome.count)} entries
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(stats.budgetStats.totalIncome.amount)}
                </p>
              </div>
              <div>
                <p className="font-semibold">Amount Received</p>
                <p className="text-sm text-gray-600">
                  {formatNumber(stats.budgetStats.amountReceived.count)} entries
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(stats.budgetStats.amountReceived.amount)}
                </p>
                <div className="text-sm text-gray-600 mt-1">
                  <p>Online: {formatAmount(stats.budgetStats.online.amount)}</p>
                  <p>Offline: {formatAmount(stats.budgetStats.offline.amount)}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold">Amount Pending</p>
                <p className="text-sm text-gray-600">
                  {formatNumber(stats.budgetStats.amountPending.count)} entries
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(stats.budgetStats.amountPending.amount)}
                </p>
              </div>
              <div>
                <p className="font-semibold">Total Expenses</p>
                <p className="text-sm text-gray-600">
                  {formatNumber(stats.budgetStats.totalExpenses.count)} entries
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(stats.budgetStats.totalExpenses.amount)}
                </p>
              </div>
              <div>
                <p className="font-semibold">Previous Year Amount</p>
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
                    <p className="text-lg font-bold">
                      {formatAmount(stats.budgetStats.previousYearAmount.amount)}
                    </p>
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
                <p className="font-semibold">Amount Left</p>
                <p className="text-xs text-gray-500">(Excluding Previous Year Amount)</p>
                <p className={`text-lg font-bold ${stats.budgetStats.amountLeft.amount < 0 ? 'text-red-600' : ''}`}>
                  {formatAmount(stats.budgetStats.amountLeft.amount)}
                  {stats.budgetStats.amountLeft.amount < 0 && (
                    <span className="ml-2 text-red-500 font-semibold">(Shortage)</span>
                  )}
                </p>
                <div className="text-sm text-gray-600 mt-1">
                  <p>Online: {formatAmount(stats.budgetStats.amountLeft.onlineAmount)}</p>
                  <p>Offline: {formatAmount(stats.budgetStats.amountLeft.cashAmount)}</p>
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
              <p className="text-lg font-bold">
                {formatNumber(stats.userStats.totalUsers)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">APP Payments</p>
              <p className="text-lg font-bold">
                {formatNumber(stats.userStats.successfulPayments)}
              </p>
            </div>
          </div>
        </div>

        {/* Villagers Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Villagers</h2>
          <div className="mb-4">
            <p className="text-lg font-bold">
              Total Amount: {formatAmount(stats.villagers.total)}
            </p>
          </div>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left font-semibold">Status</th>
                <th className="text-right font-semibold">Cash</th>
                <th className="text-right font-semibold">Online</th>
                <th className="text-right font-semibold">Web App</th>
                <th className="text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paid</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.cash)}</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.online)}</td>
                <td className="text-right">{formatAmount(stats.villagers.paid.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.villagers.paid.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.cash)}</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.online)}</td>
                <td className="text-right">{formatAmount(stats.villagers.pending.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.villagers.pending.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Youth Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Youth</h2>
          <div className="mb-4">
            <p className="text-lg font-bold">
              Total Amount: {formatAmount(stats.youth.total)}
            </p>
          </div>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left font-semibold">Status</th>
                <th className="text-right font-semibold">Cash</th>
                <th className="text-right font-semibold">Online</th>
                <th className="text-right font-semibold">Web App</th>
                <th className="text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paid</td>
                <td className="text-right">{formatAmount(stats.youth.paid.cash)}</td>
                <td className="text-right">{formatAmount(stats.youth.paid.online)}</td>
                <td className="text-right">{formatAmount(stats.youth.paid.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.youth.paid.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.youth.pending.cash)}</td>
                <td className="text-right">{formatAmount(stats.youth.pending.online)}</td>
                <td className="text-right">{formatAmount(stats.youth.pending.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.youth.pending.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Stats;
