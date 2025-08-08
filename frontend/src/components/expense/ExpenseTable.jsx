import { Edit2, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

function ExpenseTable({
  expenses,
  visibleColumns,
  onEdit,
  onDelete,
  isPrivilegedUser,
  userRole,
  isLocked = false
}) {
  const canViewPhoneNumber = ['developer', 'financier', 'admin'].includes(userRole);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
            {visibleColumns.expenseId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense ID</th>
            )}
            {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
            )}
            {visibleColumns.dateTime && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
            )}
            {visibleColumns.purpose && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
            )}
            {visibleColumns.amount && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            )}
            {visibleColumns.bill && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill</th>
            )}
            {visibleColumns.paymentMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
            )}
            {visibleColumns.verifyLog && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
            )}
            {visibleColumns.name && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spender Name</th>
            )}
            {canViewPhoneNumber && visibleColumns.phoneNumber && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
            )}
            {isPrivilegedUser && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense, index) => (
            <tr key={expense._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
              {visibleColumns.expenseId && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.expenseId}</td>
              )}
              {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.registerId}</td>
              )}
              {visibleColumns.dateTime && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(expense.createdAt)}</td>
              )}
              {visibleColumns.purpose && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.purpose}</td>
              )}
              {visibleColumns.amount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.amount}</td>
              )}
              {visibleColumns.bill && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expense.billImage ? (
                    <a
                      href={expense.billImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Bill
                    </a>
                  ) : (
                    'No Bill'
                  )}
                </td>
              )}
              {visibleColumns.paymentMode && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.paymentMode}</td>
              )}
              {visibleColumns.verifyLog && (
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
                    {expense.verifyLog}
                  </span>
                </td>
              )}
              {visibleColumns.name && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.name}</td>
              )}
              {canViewPhoneNumber && visibleColumns.phoneNumber && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{expense.phoneNumber}</td>
              )}
              {isPrivilegedUser && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      disabled={isLocked}
                      className={`text-indigo-600 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-900'}`}
                      title={isLocked ? 'Locked' : 'Edit'}
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(expense._id)}
                      disabled={isLocked}
                      className={`text-red-600 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-900'}`}
                      title={isLocked ? 'Locked' : 'Delete'}
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
