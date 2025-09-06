import { IndianRupee, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import StatsPrint from './StatsPrint';

function EstimationStats({ stats, budgetStats }) {
  const noTranslate = (value) => {
    return <span translate="no" className="notranslate">{value}</span>;
  };

  const formatAmount = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return noTranslate(formatted);
  };

  const formatAmountAsString = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return noTranslate(num);
  };

  const currentIncome = budgetStats?.totalIncome?.amount || 0;
  const currentExpense = budgetStats?.totalExpenses?.amount || 0;
  const currentAmountLeft = budgetStats?.amountLeft?.amount || 0;
  
  const estimatedIncome = stats.totalEstimatedIncome || 0;
  const estimatedExpense = stats.totalEstimatedExpense || 0;
  const estimatedAmountLeft = estimatedIncome - estimatedExpense;

  const incomeExpenseBalance = currentIncome - estimatedExpense;
  const incomeExpenseBalancePositive = incomeExpenseBalance >= 0;

  const incomeComparison = currentIncome - estimatedIncome;
  const incomeComparisonPositive = incomeComparison >= 0;

  const expenseComparison = currentExpense - estimatedExpense;
  const expenseComparisonPositive = expenseComparison <= 0;

  const amountLeftComparison = currentAmountLeft - estimatedAmountLeft;
  const amountLeftComparisonPositive = amountLeftComparison >= 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-0">
        <StatsPrint stats={stats} budgetStats={budgetStats} />
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income vs Expense Balance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2" />
            Curent Income vs Estimated Expense
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Income:</span>
              <span className="font-semibold">{formatAmount(currentIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Expense:</span>
              <span className="font-semibold">{formatAmount(estimatedExpense)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Balance:</span>
              <span className={`font-bold ${incomeExpenseBalancePositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(incomeExpenseBalance)}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${incomeExpenseBalancePositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {incomeExpenseBalancePositive ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${incomeExpenseBalancePositive ? 'text-green-800' : 'text-red-800'}`}>
                  {incomeExpenseBalancePositive 
                    ? `🎉 We will get ${formatAmountAsString(Math.abs(incomeExpenseBalance))} amount left after meeting expectations`
                    : `Still ${formatAmountAsString(Math.abs(incomeExpenseBalance))} amount required to reach expectations`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Income Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2" />
            Income Comparison
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Income:</span>
              <span className="font-semibold">{formatAmount(currentIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Income:</span>
              <span className="font-semibold">{formatAmount(estimatedIncome)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Difference:</span>
              <span className={`font-bold ${incomeComparisonPositive ? 'text-green-600' : 'text-red-600'}`}>
                {incomeComparisonPositive ? '+' : ''}{formatAmount(incomeComparison)}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${incomeComparisonPositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {incomeComparisonPositive ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${incomeComparisonPositive ? 'text-green-800' : 'text-red-800'}`}>
                  {incomeComparisonPositive 
                    ? `🎉 Amount ${formatAmountAsString(Math.abs(incomeComparison))} more than estimated income`
                    : `Amount ${formatAmountAsString(Math.abs(incomeComparison))} less than estimated income`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DollarSign className="mr-2" />
            Expense Comparison
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Expense:</span>
              <span className="font-semibold">{formatAmount(currentExpense)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Expense:</span>
              <span className="font-semibold">{formatAmount(estimatedExpense)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Difference:</span>
              <span className={`font-bold ${expenseComparisonPositive ? 'text-green-600' : 'text-red-600'}`}>
                {expenseComparison > 0 ? '+' : ''}{formatAmount(expenseComparison)}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${expenseComparisonPositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {expenseComparisonPositive ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${expenseComparisonPositive ? 'text-green-800' : 'text-red-800'}`}>
                  {expenseComparisonPositive 
                    ? `🎉 Saved amount ${formatAmountAsString(Math.abs(expenseComparison))} compared to estimate`
                    : `Overspent by amount ${formatAmountAsString(Math.abs(expenseComparison))}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Left Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="mr-2" />
            Amount Left Comparison
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Amount Left:</span>
              <span className="font-semibold">{formatAmount(currentAmountLeft)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Amount Left:</span>
              <span className="font-semibold">{formatAmount(estimatedAmountLeft)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Difference:</span>
              <span className={`font-bold ${amountLeftComparisonPositive ? 'text-green-600' : 'text-red-600'}`}>
                {amountLeftComparison > 0 ? '+' : ''}{formatAmount(amountLeftComparison)}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${amountLeftComparisonPositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {amountLeftComparisonPositive ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${amountLeftComparisonPositive ? 'text-green-800' : 'text-red-800'}`}>
                  {amountLeftComparisonPositive 
                    ? `🎉 Amount ${formatAmountAsString(Math.abs(amountLeftComparison))} extra savings achieved`
                    : `Amount ${formatAmountAsString(Math.abs(amountLeftComparison))} short of estimated savings`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Estimation Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Estimation Stats</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              Income
            </h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">
                {formatNumber(stats.incomeCount || 0)} entries
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(stats.totalEstimatedIncome)}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              Expense
            </h3>
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
      
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">Estimated Amount Left</h3>
          <div className="flex items-center">
            <p className={`text-lg font-bold ${stats.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(stats.balance)}
            </p>
            {stats.balance < 0 && (
              <p className="ml-2 text-red-500 font-semibold">(Shortage)</p>
            )}
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              <span>Youth</span>
              <span className="text-lg font-bold">{formatAmount((stats.youthPaid || 0) + (stats.youthNotPaid || 0))}</span>
            </h3>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.youthCount || 0)} entries
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Paid: <span className="font-bold">{formatAmount(stats.youthPaid || 0)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Not Paid: <span className="font-bold">{formatAmount(stats.youthNotPaid || 0)}</span>
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              <span>Villagers</span>
              <span className="text-lg font-bold">{formatAmount((stats.villagersPaid || 0) + (stats.villagersNotPaid || 0))}</span>
            </h3>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.villagersCount || 0)} entries
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Paid: <span className="font-bold">{formatAmount(stats.villagersPaid || 0)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Not Paid: <span className="font-bold">{formatAmount(stats.villagersNotPaid || 0)}</span>
              </p>
            </div>  
          </div>  
        </div>
      
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Overall Payment Status</h3>
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
    </div>
  );
}

export default EstimationStats;