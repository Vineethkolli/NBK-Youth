import { IndianRupee, Users } from 'lucide-react';

function HistoryStats({ stats, eventName, year }) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No statistics data available for {eventName} {year}
      </div>
    );
  }

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
    }).format(amount || 0);
    return noTranslate(formatted);
  };

  // Wrap plain numbers in a noTranslate span
  const formatNumber = (num) => {
    return noTranslate(num || 0);
  };

  const budgetStats = stats.budgetStats || {};
  const userStats = stats.userStats || {};

  return (
    <div className="p-6 space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{eventName} {year} - Statistics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Stats */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" /> Budget Stats
          </h3>
          <div className="space-y-4">
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
        </div>

        {/* User Stats */}
        <div className="bg-gray-50 rounded-lg p-6">
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
    </div>
  );
}

export default HistoryStats;