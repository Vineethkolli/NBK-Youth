import { useState } from 'react';
import { Eye, EyeOff, Edit2, Trash2, Loader2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useHiddenProfiles } from '../../context/HiddenProfileContext';
import { formatDateTime } from '../../utils/dateTime';

function IncomeTable({
  incomes,
  visibleColumns,
  onEdit,
  onDelete,
  isPrivilegedUser,
  isLocked = false,
}) {
  const { hiddenProfiles, toggleProfileHidden } = useHiddenProfiles();
  const [deletingId, setDeletingId] = useState(null);
  const [togglingHiddenId, setTogglingHiddenId] = useState(null);

  const handleToggleHidden = async (incomeId) => {
    if (!isPrivilegedUser || isLocked) return;
    try {
      setTogglingHiddenId(incomeId);
      await toggleProfileHidden(incomeId);
    } finally {
      setTogglingHiddenId(null);
    }
  };

  const handleDelete = async (incomeId) => {
    try {
      setDeletingId(incomeId);
      await onDelete(incomeId);
    } finally {
      setDeletingId(null);
    }
  };

  const sendWhatsAppMessage = (income) => {
    if (isLocked) return;
    const countryCode = '+91';
    const { phoneNumber, name } = income;
    const formattedDate = formatDateTime(income.createdAt);

    const message =
      income.status === 'paid'
        ? `Dear ${name},\n\nThank you for your contribution!\n\nPayment Details:\n- Income Id: ${income.incomeId}\n- Amount: ₹${income.amount}\n- Date: ${formattedDate}\n- Status: ${income.status}\n- Payment Mode: ${income.paymentMode}\n\nBest regards,\nNBK Youth`
        : `Dear ${name},\n\nThis is a gentle reminder about your pending contribution.\n\nPayment Details:\n- Income Id: ${income.incomeId}\n- Amount: ₹${income.amount}\n- Date: ${formattedDate}\n- Status: ${income.status}\n\nKindly make the payment at your earliest convenience.\n\nBest regards,\nNBK Youth`;

    const url = `https://wa.me/${countryCode}${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getWhatsAppIconColor = (income) => {
    if (!income.phoneNumber) return 'text-gray-300';
    return income.status === 'paid'
      ? 'text-green-500 hover:text-green-700'
      : 'text-red-500 hover:text-red-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
            {isPrivilegedUser && visibleColumns.registerId && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
            )}
            {visibleColumns.incomeId && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income ID</th>}
            {visibleColumns.entryDate && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Date</th>}
            {visibleColumns.paidDate && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>}
            {visibleColumns.name && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>}
            {isPrivilegedUser && visibleColumns.email && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>}
            {isPrivilegedUser && visibleColumns.phoneNumber && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>}
            {visibleColumns.amount && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>}
            {visibleColumns.status && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>}
            {visibleColumns.paymentMode && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>}
            {visibleColumns.belongsTo && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>}
            {visibleColumns.verifyLog && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>}
            {isPrivilegedUser && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {incomes.map((income, index) => {
            const isHidden = hiddenProfiles.has(income._id);
            return (
              <tr key={income._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                {isPrivilegedUser && visibleColumns.registerId && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{income.registerId}</td>
                )}
                {visibleColumns.incomeId && <td className="px-6 py-4 whitespace-nowrap text-sm">{income.incomeId}</td>}
                {visibleColumns.entryDate && <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(income.createdAt)}</td>}
                {visibleColumns.paidDate && <td className="px-6 py-4 whitespace-nowrap text-sm">{income.paidDate ? formatDateTime(income.paidDate) : '-'}</td>}
                {visibleColumns.name && <td className="px-6 py-4 whitespace-nowrap text-sm">{isHidden ? 'Donor' : income.name}</td>}

                {isPrivilegedUser && visibleColumns.email && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{isHidden ? 'Donor' : income.email}</td>
                )}

                {isPrivilegedUser && visibleColumns.phoneNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                    {isHidden ? (
                      <span className="text-gray-500">Donor</span>
                    ) : (
                      <>
                        <span>{income.phoneNumber}</span>
                        <button
                          onClick={() => income.phoneNumber && sendWhatsAppMessage(income)}
                          disabled={!income.phoneNumber || isLocked}
                          className={`${getWhatsAppIconColor(income)} ${
                            (!income.phoneNumber || isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={income.phoneNumber ? (isLocked ? 'Locked' : 'Send WhatsApp') : 'No number'}
                        >
                          <FaWhatsapp className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                )}

                {visibleColumns.amount && <td className="px-6 py-4 whitespace-nowrap text-sm">{income.amount}</td>}
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
                {visibleColumns.paymentMode && <td className="px-6 py-4 whitespace-nowrap text-sm">{income.paymentMode}</td>}
                {visibleColumns.belongsTo && <td className="px-6 py-4 whitespace-nowrap text-sm">{income.belongsTo}</td>}
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

                {isPrivilegedUser && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleHidden(income._id)}
                        disabled={isLocked || togglingHiddenId === income._id}
                        className={`text-gray-600 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-900'
                        }`}
                        title={isLocked ? 'Locked' : isHidden ? 'Show Donor' : 'Hide Donor'}
                      >
                        {togglingHiddenId === income._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isHidden ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => onEdit(income)}
                        disabled={isLocked}
                        className={`text-indigo-600 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-900'
                        }`}
                        title={isLocked ? 'Locked' : 'Edit'}
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleDelete(income._id)}
                        disabled={isLocked || deletingId === income._id}
                        className={`text-red-600 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-900'
                        }`}
                        title={isLocked ? 'Locked' : 'Delete'}
                      >
                        {deletingId === income._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
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
