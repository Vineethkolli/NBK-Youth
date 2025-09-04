import { formatDateTime } from '../../utils/dateTime';

function HistoryExpense({ expenses, eventName, year }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No expense data available for {eventName} {year}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{eventName} {year} - Expense Records</h2>
        <p className="text-sm text-gray-600">{expenses.length} entries</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spender Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={expense._id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.expenseId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.purpose}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.paymentMode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expense.createdAt ? formatDateTime(expense.createdAt) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.verifyLog === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : expense.verifyLog === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {expense.verifyLog || 'not verified'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryExpense;