import { Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useHiddenProfiles } from '../../context/HiddenProfileContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateTime';

function IncomeTable({
  incomes,
  visibleColumns,
  onEdit,
  onDelete,
  isPrivilegedUser,
  userRole,
}) {
  const { hiddenProfiles, toggleProfileHidden } = useHiddenProfiles();
  const { user } = useAuth();

  const canViewPhoneNumber = ['developer', 'financier', 'admin'].includes(userRole);
  const canToggleHidden = ['developer', 'financier', 'admin'].includes(userRole);
  const showActionsColumn = ['developer', 'financier', 'admin'].includes(userRole);

  const handleToggleHidden = async (incomeId) => {
    if (!canToggleHidden) return;
    await toggleProfileHidden(incomeId);
  };

  const sendWhatsAppMessage = (income) => {
    const countryCode = '+91'; 
    const phoneNumber = income.phoneNumber;
    const name = income.name;
    const formattedDate = formatDateTime(income.createdAt);
    let message;

    if (income.status === 'paid') {
      message = `Dear ${name},\n\nThank you for your contribution!\n\nPayment Details:\n- Income Id: ${income.incomeId}\n- Amount: ₹${income.amount}\n- Date: ${formattedDate}\n- Status: ${income.status}\n- Payment Mode: ${income.paymentMode}\n\nYour support is greatly appreciated.\n\nBest regards,\nNBK Youth`;
    } else {
      message = `Dear ${name},\n\nThis is a gentle reminder about your pending contribution.\n\nPayment Details:\n- Income Id: ${income.incomeId}\n- Amount: ₹${income.amount}\n- Date: ${formattedDate}\n- Status: ${income.status}\n\nKindly make the payment at your earliest convenience.\n\nBest regards,\nNBK Youth`;
    }

    const url = `https://wa.me/${countryCode}${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getWhatsAppIconColor = (income) => {
    if (!income.phoneNumber) return 'text-gray-300'; 
    return income.status === 'paid' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700';
  };

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
            {canViewPhoneNumber && visibleColumns.email && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
            )}
            {canViewPhoneNumber && visibleColumns.phoneNumber && (
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
            {showActionsColumn && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {incomes.map((income, index) => {
            const isHidden = hiddenProfiles.has(income._id);

            return (
              <tr key={income._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{index + 1}</td>
                {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.registerId}</td>
                )}
                {visibleColumns.incomeId && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.incomeId}</td>
                )}
                {visibleColumns.dateTime && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(income.createdAt)}
                  </td>
                )}
                {visibleColumns.name && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isHidden ? <span className="text-gray-500">Donor</span> : income.name}
                  </td>
                )}
                {canViewPhoneNumber && visibleColumns.email && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">
                    {isHidden ? <span className="text-gray-500">Donor</span> : income.email}
                  </td>
                )}
                {canViewPhoneNumber && visibleColumns.phoneNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2 notranslate">
                    {isHidden ? (
                      <span className="text-gray-500">Donor</span>
                    ) : (
                      <>
                        <span>{income.phoneNumber}</span>
                        <button
                          onClick={() => income.phoneNumber && sendWhatsAppMessage(income)}
                          disabled={!income.phoneNumber}
                          className={`${getWhatsAppIconColor(income)} transition-colors duration-200`}
                          title={income.phoneNumber ? 'Send WhatsApp message' : 'No phone number available'}
                        >
                          <FaWhatsapp className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                )}
                {visibleColumns.amount && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{income.amount}</td>
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
                {showActionsColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {canToggleHidden && (
                        <button
                          onClick={() => handleToggleHidden(income._id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      )}
                      {['developer', 'financier', 'admin'].includes(userRole) && (
                        <button
                          onClick={() => onEdit(income)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      )}
                      {['developer', 'financier'].includes(userRole) && (
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