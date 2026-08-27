import { useState } from 'react';
import { IndianRupee, Users, Edit2, Info, X } from 'lucide-react';
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
  additionalAmount,
  setAdditionalAmount,
  remarks,
  setRemarks,
  isAddingPreviousYear,
  handlePreviousYearUpdate
}) {
  const { hasAccess } = useAuth();
  const [infoDialog, setInfoDialog] = useState(null);

  const infoText = {
  amountLeft: {
    title: 'Amount Left',
    description: 'Excluding previous year amount and additional amount'
  },
  finalAmountLeft: {
    title: 'Final Amount Left',
    description: 'Including previous year amount and additional amount'
  }
};
  
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
                  <p className="font-semibold">Additional Amount</p>
                  <input
                    type="number"
                    value={additionalAmount}
                    onChange={(e) => setAdditionalAmount(Number(e.target.value))}
                    placeholder="Additional Amount"
                    className="w-full rounded border-gray-300"
                    disabled={lockSettings.isLocked}
                  />
                  <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks"
              rows={1}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={lockSettings.isLocked}
            />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditingPreviousYear(false);
                        setPreviousYearAmount(stats.budgetStats.previousYearAmount.amount);
                        setAdditionalAmount(stats.budgetStats.previousYearAmount.additionalAmount || 0);
                        setRemarks(stats.budgetStats.previousYearAmount.remarks || '');
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
              {!isEditingPreviousYear && (
                <div className="mt-1 space-y-1">
                  <div>
                    <p className="font-semibold">Additional Amount</p>
                    <p className="text-lg font-bold">
                      {formatAmount(stats.budgetStats.previousYearAmount.additionalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Remarks</p>
                    <p className=" text-sm text-gray-600">
                      {stats.budgetStats.previousYearAmount.remarks || 'NA'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">Amount Left</p>
                <button
                  type="button"
                  onClick={() => setInfoDialog('amountLeft')}
                  className="text-gray-400 transition-colors hover:text-indigo-600"
                  aria-label="Amount Left information"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
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
              <div className="flex items-center gap-1.5 mt-3">
                <p className="font-semibold">Final Amount Left</p>
                <button
                  type="button"
                  onClick={() => setInfoDialog('finalAmountLeft')}
                  className="text-gray-400 transition-colors hover:text-indigo-600"
                  aria-label="Final Amount Left information"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <p className={`text-lg font-bold ${((stats.budgetStats.amountLeft.amount || 0) + (stats.budgetStats.previousYearAmount.amount || 0) + (stats.budgetStats.previousYearAmount.additionalAmount || 0)) < 0 ? 'text-red-600' : ''}`}>
                {formatAmount((stats.budgetStats.amountLeft.amount || 0) + (stats.budgetStats.previousYearAmount.amount || 0) + (stats.budgetStats.previousYearAmount.additionalAmount || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {infoDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setInfoDialog(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInfoDialog(null)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
              aria-label="Close information"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="pr-6">
  <h3 className="text-base font-semibold text-gray-900 mb-1">
    {infoText[infoDialog].title}
  </h3>
  <p className="text-sm text-gray-700">
    {infoText[infoDialog].description}
  </p>
</div>
          </div>
        </div>
      )}

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
