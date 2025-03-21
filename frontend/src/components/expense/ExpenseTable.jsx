import { Edit2, Trash2 } from 'lucide-react';

function ExpenseTable({
  expenses,
  visibleColumns,
  onEdit,
  onDelete,
  isPrivilegedUser,
  userRole,
  onUpdate
}) {
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  const calculateTotalSpent = (subExpenses) => {
    return subExpenses.reduce((sum, sub) => sum + Number(sub.subAmount), 0);
  };

  const canViewPhoneNumber = ['developer', 'financier', 'admin'].includes(userRole);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              S.No
            </th>
            {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Register ID
              </th>
            )}
            {visibleColumns.expenseId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expense ID
              </th>
            )}
            {visibleColumns.dateTime && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
            )}
            {visibleColumns.purpose && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Purpose
              </th>
            )}
            {visibleColumns.spenderName && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Spender Name
              </th>
            )}
            {canViewPhoneNumber && visibleColumns.phoneNumber && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone Number
              </th>
            )}
            {visibleColumns.amountTaken && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount Taken
              </th>
            )}
            {visibleColumns.totalSpent && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total Amount Spent
              </th>
            )}
            {visibleColumns.subPurpose && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sub Purpose
              </th>
            )}
            {visibleColumns.subAmount && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sub Amount
              </th>
            )}
            {visibleColumns.amountReturned && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount Returned
              </th>
            )}
            {visibleColumns.bill && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Bill
              </th>
            )}
            {visibleColumns.paymentMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Mode
              </th>
            )}
            {visibleColumns.verifyLog && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Verify Log
              </th>
            )}
            {isPrivilegedUser && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense, index) => (
            <tr key={expense._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
              {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.registerId}</td>
              )}
              {visibleColumns.expenseId && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.expenseId}</td>
              )}
              {visibleColumns.dateTime && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDate(expense.createdAt)}
                </td>
              )}
              {visibleColumns.purpose && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.purpose}</td>
              )}
              {visibleColumns.spenderName && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.name}</td>
              )}
              {canViewPhoneNumber && visibleColumns.phoneNumber && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.phoneNumber}</td>
              )}
              {visibleColumns.amountTaken && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.amount}</td>
              )}
              {visibleColumns.totalSpent && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {calculateTotalSpent(expense.subExpenses)}
                </td>
              )}
              {visibleColumns.subPurpose && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <ul className="list-disc list-inside">
                    {expense.subExpenses.map((sub, idx) => (
                      <li key={idx}>{sub.subPurpose}</li>
                    ))}
                  </ul>
                </td>
              )}
              {visibleColumns.subAmount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  <ul className="list-inside">
                    {expense.subExpenses.map((sub, idx) => (
                      <li key={idx}>{sub.subAmount}</li>
                    ))}
                  </ul>
                </td>
              )}
              {visibleColumns.amountReturned && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {expense.amountReturned || 0}
                </td>
              )}
              {visibleColumns.bill && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <ul className="list-inside">
                    {expense.subExpenses.map((sub, idx) => (
                      <li key={idx}>
                        {sub.billImage ? (
                          <a
                            href={sub.billImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Bill
                          </a>
                        ) : (
                          'No Bill'
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
              )}
              {visibleColumns.paymentMode && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expense.paymentMode}
                </td>
              )}
              {visibleColumns.verifyLog && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.verifyLog === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : expense.verifyLog === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : expense.verifyLog === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {expense.verifyLog}
                  </span>
                </td>
              )}
              {isPrivilegedUser && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(expense._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseTable;
