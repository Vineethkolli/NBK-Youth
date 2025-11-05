function HistoryIncome({ incomes, snapshotName, showBelongsTo }) {
  if (!incomes || incomes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No income data available for {snapshotName}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto  rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              {showBelongsTo && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incomes.map((income, index) => (
              <tr key={income._id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{income.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.amount}</td>
                {showBelongsTo && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.belongsTo || '-'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryIncome;
