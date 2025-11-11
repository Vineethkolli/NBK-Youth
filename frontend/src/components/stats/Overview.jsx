import { IndianRupee, Users, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StatsOverview({
  stats,
  lockSettings,
  formatAmount,
  formatNumber,
  isEditingPreviousYear,
  setIsEditingPreviousYear,
  previousYearAmount,
  setPreviousYearAmount,
  isAddingPreviousYear,
  handlePreviousYearUpdate
}) {
  const { hasAccess } = useAuth();
  
  return (
    <>
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

            {/* Previous Year Amount */}
            <div>
              <p className="font-semibold">Previous Year Amount</p>
              {hasAccess('Privileged') && isEditingPreviousYear ? (
                <div className="flex flex-col space-y-2">
                  <input
                    type="number"
                    value={previousYearAmount}
                    onChange={(e) => setPreviousYearAmount(Number(e.target.value))}
                    className="w-full rounded border-gray-300"
                    disabled={lockSettings.isLocked}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditingPreviousYear(false);
                        setPreviousYearAmount(stats.budgetStats.previousYearAmount.amount);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      disabled={lockSettings.isLocked}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePreviousYearUpdate}
                      className={`px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${isAddingPreviousYear ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={lockSettings.isLocked || isAddingPreviousYear}
                    >
                      {isAddingPreviousYear ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center space-x-2 ${lockSettings.isLocked ? ' pointer-events-none' : ''}`}>
                  <p className="text-lg font-bold">
                    {formatAmount(stats.budgetStats.previousYearAmount.amount)}
                  </p>
                  {hasAccess('Privileged') && (
                    <button
                      onClick={() => setIsEditingPreviousYear(true)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={lockSettings.isLocked}
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

      {/* Date-wise Stats */}
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
              {stats.dateWiseStats?.map((dayStat, index) => (
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
          {stats.dateWiseStats?.length > 0 && (
            <div className="text-center py-2 text-sm text-gray-500">
              Total: {formatNumber(stats.dateWiseStats.length)} days
            </div>
          )}
        </div>
      </div>
    </>
  );
}
