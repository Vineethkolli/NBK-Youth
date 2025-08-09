import { Edit2, Trash2 } from 'lucide-react';

function EstimatedExpenseTable({
  expenses,
  visibleColumns,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns.sno && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                S.No
              </th>
            )}
            {visibleColumns.purpose && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Purpose
              </th>
            )}
            {visibleColumns.previousAmount && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Previous Amount
              </th>
            )}
            {visibleColumns.presentAmount && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Present Amount
              </th>
            )}
            {visibleColumns.others && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Others
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense, index) => (
            <tr key={expense._id}>
              {visibleColumns.sno && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {index + 1}
                </td>
              )}
              {visibleColumns.purpose && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expense.purpose}
                </td>
              )}
              {visibleColumns.previousAmount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {expense.previousAmount}
                </td>
              )}
              {visibleColumns.presentAmount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {expense.presentAmount}
                </td>
              )}
              {visibleColumns.others && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {expense.others}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button onClick={() => onEdit(expense)} className="text-blue-600 hover:text-blue-900">
                  <Edit2 className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(expense._id)} className="text-red-600 hover:text-red-900 ml-2">
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EstimatedExpenseTable;
