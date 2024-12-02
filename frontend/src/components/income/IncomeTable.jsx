import { Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

function IncomeTable({
  incomes,
  visibleColumns,
  hiddenProfiles,
  onPrivacyToggle,
  onEdit,
  onDelete,
  isPrivilegedUser,
  userRole, // assuming userRole is passed as 'developer', 'financier', 'admin', 'user', etc.
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              S.No
            </th>
            {/* Only show Register ID for 'developer', 'financier' roles */}
            {(userRole === 'developer' || userRole === 'financier') &&
              visibleColumns.registerId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Register ID
                </th>
              )}
            {visibleColumns.incomeId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Income ID
              </th>
            )}
            {visibleColumns.dateTime && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
            )}
            {visibleColumns.name && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
            )}
            {/* Only show Email and Phone Number for non-user roles */}
            {(userRole !== 'user') && visibleColumns.email && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
            )}
            {(userRole !== 'user') && visibleColumns.phoneNumber && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone Number
              </th>
            )}
            {visibleColumns.amount && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            )}
            {visibleColumns.paymentMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Mode
              </th>
            )}
            {visibleColumns.belongsTo && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Belongs To
              </th>
            )}
            {visibleColumns.verifyLog && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Verify Log
              </th>
            )}
            {isPrivilegedUser && userRole !== 'user' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {incomes.map((income, index) => {
            const isHidden = hiddenProfiles.has(income._id); // Check if this income is hidden

            return (
              <tr key={income._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                {/* Only show Register ID for 'developer', 'financier' */}
                {(userRole === 'developer' || userRole === 'financier') &&
                  visibleColumns.registerId && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{income.registerId}</td>
                  )}
                {visibleColumns.incomeId && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.incomeId}</td>
                )}
                {visibleColumns.dateTime && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(income.createdAt)}
                  </td>
                )}
                {visibleColumns.name && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isHidden ? <span className="text-gray-500">Hidden</span> : income.name}
                  </td>
                )}
                {/* Only show Email and Phone Number for non-user roles */}
                {userRole !== 'user' && visibleColumns.email && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isHidden ? <span className="text-gray-500">Hidden</span> : income.email}
                  </td>
                )}
                {userRole !== 'user' && visibleColumns.phoneNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isHidden ? <span className="text-gray-500">Hidden</span> : income.phoneNumber}
                  </td>
                )}
                {visibleColumns.amount && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.amount}</td>
                )}
                {visibleColumns.status && (
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
                )}
                {visibleColumns.paymentMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.paymentMode}</td>
                )}
                {visibleColumns.belongsTo && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.belongsTo}</td>
                )}
                {visibleColumns.verifyLog && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        income.verifyLog === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : income.verifyLog === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {income.verifyLog}
                    </span>
                  </td>
                )}
                {isPrivilegedUser && userRole !== 'user' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {userRole !== 'admin' && (
                        <button
                          onClick={() => onPrivacyToggle(income._id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(income)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      {userRole !== 'admin' && (
                        <button
                          onClick={() => onDelete(income._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default IncomeTable;
