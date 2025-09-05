import { IndianRupee, Users } from 'lucide-react';

function HistoryStats({ stats, snapshotName }) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No statistics data available for {snapshotName}
      </div>
    );
  }

  const noTranslate = (value) => (
    <span translate="no" className="notranslate">{value}</span>
  );

  const formatAmount = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
    return noTranslate(formatted);
  };

  const formatNumber = (num) => noTranslate(num || 0);

  const budgetStats = stats.budgetStats || {};
  const userStats = stats.userStats || {};

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{snapshotName} - Statistics</h2>
      </div>

      {/* Budget + User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Stats */}
        <div className="bg-gray-50 rounded-lg p-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" /> Budget Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Total Income</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.totalIncome?.count)} entries
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(budgetStats.totalIncome?.amount)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Amount Received</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.amountReceived?.count)} entries
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(budgetStats.amountReceived?.amount)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Amount Pending</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.amountPending?.count)} entries
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatAmount(budgetStats.amountPending?.amount)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Total Expenses</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.totalExpenses?.count)} entries
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatAmount(budgetStats.totalExpenses?.amount)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Previous Year Amount</p>
              <p className="text-lg font-bold">
                {formatAmount(budgetStats.previousYearAmount?.amount)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Amount Left</p>
              <p className={`text-lg font-bold ${(budgetStats.amountLeft?.amount || 0) < 0 ? 'text-red-600' : ''}`}>
                {formatAmount(budgetStats.amountLeft?.amount)}
                {(budgetStats.amountLeft?.amount || 0) < 0 && (
                  <span className="ml-2 text-red-500 font-semibold">(Shortage)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-gray-50 rounded-lg p-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="mr-2" /> User Stats
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-lg font-bold">
                {formatNumber(userStats.totalUsers)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">APP Payments</p>
              <p className="text-lg font-bold">
                {formatNumber(userStats.successfulPayments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Villagers + Youth side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Villagers Stats */}
        <div className="bg-gray-50 rounded-lg p-2">
          <h3 className="text-lg font-semibold mb-4">Villagers</h3>
          <div className="mb-4">
            <p className="text-lg font-bold">
              Total Amount: {formatAmount(stats.villagers?.total || 0)}
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
                <td className="text-right">{formatAmount(stats.villagers?.paid?.cash || 0)}</td>
                <td className="text-right">{formatAmount(stats.villagers?.paid?.online || 0)}</td>
                <td className="text-right">{formatAmount(stats.villagers?.paid?.webApp || 0)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.villagers?.paid?.total || 0)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.villagers?.pending?.cash || 0)}</td>
                <td className="text-right">{formatAmount(stats.villagers?.pending?.online || 0)}</td>
                <td className="text-right">{formatAmount(stats.villagers?.pending?.webApp || 0)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.villagers?.pending?.total || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Youth Stats */}
        <div className="bg-gray-50 rounded-lg p-2">
          <h3 className="text-lg font-semibold mb-4">Youth</h3>
          <div className="mb-4">
            <p className="text-lg font-bold">
              Total Amount: {formatAmount(stats.youth?.total || 0)}
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
                <td className="text-right">{formatAmount(stats.youth?.paid?.cash || 0)}</td>
                <td className="text-right">{formatAmount(stats.youth?.paid?.online || 0)}</td>
                <td className="text-right">{formatAmount(stats.youth?.paid?.webApp || 0)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.youth?.paid?.total || 0)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(stats.youth?.pending?.cash || 0)}</td>
                <td className="text-right">{formatAmount(stats.youth?.pending?.online || 0)}</td>
                <td className="text-right">{formatAmount(stats.youth?.pending?.webApp || 0)}</td>
                <td className="text-right font-semibold">{formatAmount(stats.youth?.pending?.total || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Date-wise Statistics */}
      {stats.dateWiseStats && stats.dateWiseStats.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-2">
          <h3 className="text-lg font-semibold mb-4">Date-wise Stats</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Received</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Expenses</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.dateWiseStats.map((dayStat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {new Date(dayStat.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-semibold">{formatAmount(dayStat.totalIncome)}</div>
                        <div className="text-xs text-gray-500">{formatNumber(dayStat.totalIncomeEntries)} entries</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-semibold">{formatAmount(dayStat.amountReceived)}</div>
                        <div className="text-xs text-gray-500">{formatNumber(dayStat.amountReceivedEntries)} entries</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-semibold">{formatAmount(dayStat.totalExpenses)}</div>
                        <div className="text-xs text-gray-500">{formatNumber(dayStat.totalExpenseEntries)} entries</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.dateWiseStats.length > 0 && (
              <div className="text-center py-2 text-sm text-gray-500">
                Total: {formatNumber(stats.dateWiseStats.length)} days
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryStats;
