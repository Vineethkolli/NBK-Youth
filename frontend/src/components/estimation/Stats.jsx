import { IndianRupee } from 'lucide-react';
import StatsPrint from './StatsPrint';

function EstimationStats({ stats }) {
  // Wrap content in a no-translate span
  const noTranslate = (value) => {
    return <span translate="no" className="notranslate">{value}</span>;
  };

  // Format currency values and wrap them in a no-translate span
  const formatAmount = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return noTranslate(formatted);
  };

  const formatNumber = (num) => {
    return noTranslate(num);
  };

  const isShortage = stats.balance < 0;

  // Use the aggregated data from the backend
  const youthPaid = stats.youthPaid || 0;
  const youthNotPaid = stats.youthNotPaid || 0;
  const villagersPaid = stats.villagersPaid || 0;
  const villagersNotPaid = stats.villagersNotPaid || 0;

  const youthTotal = youthPaid + youthNotPaid;
  const villagersTotal = villagersPaid + villagersNotPaid;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-0">
  <StatsPrint stats={stats} />
</div>
      {/* Estimated Income and Expense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold flex items-center">
            Income
          </h2>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              {formatNumber(stats.incomeCount || 0)} entries
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatAmount(stats.totalEstimatedIncome)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold flex items-center">
            Expense
          </h2>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              {formatNumber(stats.expenseCount || 0)} entries
            </p>
            <p className="text-lg font-bold text-red-600">
              {formatAmount(stats.totalEstimatedExpense)}
            </p>
          </div>
        </div>
      </div>
    
      {/* Amount Left / Shortage */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Amount Left</h2>
        <div className="flex items-center">
          <p className={`text-lg font-bold ${isShortage ? 'text-red-600' : 'text-green-600'}`}>
            {formatAmount(stats.balance)}
          </p>
          {isShortage && (
            <p className="ml-2 text-red-500 font-semibold">(Shortage)</p>
          )}
        </div>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Youth Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
            <span>Youth</span>
            <span className="text-lg font-bold">{formatAmount(youthTotal)}</span>
          </h2>
          <p className="text-sm text-gray-600">
            {formatNumber(stats.youthCount || 0)} entries
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Paid: <span className="font-bold">{formatAmount(youthPaid)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Not Paid: <span className="font-bold">{formatAmount(youthNotPaid)}</span>
            </p>
          </div>
        </div>
        {/* Villagers Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
            <span>Villagers</span>
            <span className="text-lg font-bold">{formatAmount(villagersTotal)}</span>
          </h2>
          <p className="text-sm text-gray-600">
            {formatNumber(stats.villagersCount || 0)} entries
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Paid: <span className="font-bold">{formatAmount(villagersPaid)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Not Paid: <span className="font-bold">{formatAmount(villagersNotPaid)}</span>
            </p>
          </div>  
        </div>  
      </div>
    
      {/* Overall Payment Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Overall Payment Status</h2>
        <div className="">
          <div className="flex justify-between">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.overallPaidCount || 0)} entries
            </p>
          </div>
          <p className="text-lg font-bold text-green-600">
            {formatAmount(stats.totalEstimatedPaidIncome)}
          </p>
          <div className="flex justify-between mt-4">
            <p className="text-sm text-gray-600">Not Paid</p>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.overallNotPaidCount || 0)} entries
            </p>
          </div>
          <p className="text-lg font-bold text-red-600">
            {formatAmount(stats.totalEstimatedNotPaidIncome)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EstimationStats;
