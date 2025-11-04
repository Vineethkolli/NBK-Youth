function HistoryExpense({ expenses, snapshotName }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No expense data available for {snapshotName}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={expense._id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.purpose}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryExpense;