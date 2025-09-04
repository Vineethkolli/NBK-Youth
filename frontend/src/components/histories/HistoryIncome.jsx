import { formatDateTime } from '../../utils/dateTime';

function HistoryIncome({ incomes, eventName, year }) {
  if (!incomes || incomes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No income data available for {eventName} {year}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{eventName} {year} - Income Records</h2>
        <p className="text-sm text-gray-600">{incomes.length} entries</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incomes.map((income, index) => (
              <tr key={income._id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.incomeId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{income.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      income.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {income.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{income.paymentMode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{income.belongsTo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {income.createdAt ? formatDateTime(income.createdAt) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryIncome;