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
      maximumFractionDigits: 0,
    }).format(amount || 0);
    return noTranslate(formatted);
  };

  const formatNumber = (num) => noTranslate(num || 0);

  const { budgetStats = {}, userStats = {}, villagers = {}, youth = {}, dateWiseStats = [] } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Statistics</h1>
        </div>
      </div>

      {/* Budget + User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" /> Budget Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Total Income */}
            <div>
              <p className="font-semibold">Total Income</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.totalIncome?.count)} entries
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(budgetStats.totalIncome?.amount)}
              </p>
            </div>

            {/* Amount Received */}
            <div>
              <p className="font-semibold">Amount Received</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.amountReceived?.count)} entries
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(budgetStats.amountReceived?.amount)}
              </p>
              <div className="text-sm text-gray-600 mt-1">
                <p>Online: {formatAmount(budgetStats.online?.amount)}</p>
                <p>Offline: {formatAmount(budgetStats.offline?.amount)}</p>
              </div>
            </div>

            {/* Amount Pending */}
            <div>
              <p className="font-semibold">Amount Pending</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.amountPending?.count)} entries
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatAmount(budgetStats.amountPending?.amount)}
              </p>
            </div>

            {/* Total Expenses */}
            <div>
              <p className="font-semibold">Total Expenses</p>
              <p className="text-sm text-gray-600">
                {formatNumber(budgetStats.totalExpenses?.count)} entries
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatAmount(budgetStats.totalExpenses?.amount)}
              </p>
            </div>

            {/* Previous Year */}
            <div>
              <p className="font-semibold">Previous Year Amount</p>
              <p className="text-lg font-bold">
                {formatAmount(budgetStats.previousYearAmount?.amount)}
              </p>
            </div>

            {/* Amount Left */}
            <div>
              <p className="font-semibold">Amount Left</p>
              <p className="text-xs text-gray-500">(Excluding Previous Year Amount)</p>
              <p
                className={`text-lg font-bold ${
                  (budgetStats.amountLeft?.amount || 0) < 0
                    ? 'text-red-600'
                    : 'text-green-700'
                }`}
              >
                {formatAmount(budgetStats.amountLeft?.amount)}
                {(budgetStats.amountLeft?.amount || 0) < 0 && (
                  <span className="ml-2 text-red-500 font-semibold">(Shortage)</span>
                )}
              </p>
              <div className="text-sm text-gray-600 mt-1">
                <p>Online: {formatAmount(budgetStats.amountLeft?.onlineAmount)}</p>
                <p>Offline: {formatAmount(budgetStats.amountLeft?.cashAmount)}</p>
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
              <p className="text-lg font-bold">{formatNumber(userStats.totalUsers)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">APP Payments</p>
              <p className="text-lg font-bold">{formatNumber(userStats.successfulPayments)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Villagers + Youth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Villagers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Villagers</h2>
          <div className="mb-4">
              <p className="text-lg">
    <span className="font-bold">
      Total Amount: {formatAmount(stats.villagers.total)}
    </span>{" "}
    <span className="text-gray-700 text-sm">
      ({formatNumber(stats.villagers.count)} entries)
    </span>
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
                <td className="text-right">{formatAmount(villagers.paid?.cash)}</td>
                <td className="text-right">{formatAmount(villagers.paid?.online)}</td>
                <td className="text-right">{formatAmount(villagers.paid?.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(villagers.paid?.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(villagers.pending?.cash)}</td>
                <td className="text-right">{formatAmount(villagers.pending?.online)}</td>
                <td className="text-right">{formatAmount(villagers.pending?.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(villagers.pending?.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Youth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Youth</h2>
          <div className="mb-4">
            <p className="text-lg">
            <span className="font-bold">
            Total Amount: {formatAmount(stats.youth.total)}
           </span>{" "}
           <span className="text-gray-600 text-sm">
        ({formatNumber(stats.youth.count)} entries)
      </span>
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
                <td className="text-right">{formatAmount(youth.paid?.cash)}</td>
                <td className="text-right">{formatAmount(youth.paid?.online)}</td>
                <td className="text-right">{formatAmount(youth.paid?.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(youth.paid?.total)}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td className="text-right">{formatAmount(youth.pending?.cash)}</td>
                <td className="text-right">{formatAmount(youth.pending?.online)}</td>
                <td className="text-right">{formatAmount(youth.pending?.webApp)}</td>
                <td className="text-right font-semibold">{formatAmount(youth.pending?.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Date-wise Stats */}
      {dateWiseStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Date-wise Stats</h2>
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
                {dateWiseStats.map((dayStat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {new Date(dayStat.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
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
            <div className="text-center py-2 text-sm text-gray-500">
              Total: {formatNumber(dateWiseStats.length)} days
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryStats;
