import { Edit2, Trash2 } from 'lucide-react';

function EstimatedIncomeTable({
  incomes,
  visibleColumns,
  onAdd,
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
            {visibleColumns.registerId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
            )}
            {visibleColumns.name && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
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
            {visibleColumns.belongsTo && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Belongs to
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
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
          {incomes.map((income, index) => (
            <tr key={income._id}>
              {visibleColumns.sno && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {index + 1}
                </td>
              )}
              {visibleColumns.registerId && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">{income.registerId}</td>
              )}
              {visibleColumns.name && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {income.name}
                </td>
              )}
              {visibleColumns.previousAmount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {income.previousAmount}
                </td>
              )}
              {visibleColumns.presentAmount && (
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                  {income.presentAmount}
                </td>
              )}
              {visibleColumns.belongsTo && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {income.belongsTo}
                </td>
              )}
              {visibleColumns.status && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {income.status}
                </td>
              )}
              {visibleColumns.others && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {income.others}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button onClick={() => onEdit(income)} className="text-indigo-600 hover:text-indigo-900">
                  <Edit2 className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(income._id)} className="text-red-600 hover:text-red-900 ml-2">
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

export default EstimatedIncomeTable;
