import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Edit2, Save } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function VerificationTable({ data, type, onVerifyLogUpdate, onUpdatePayment }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    belongsTo: ''
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getVerifyLogColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const sendWhatsAppMessage = (payment) => {
    const countryCode = '+91'; 
    const phoneNumber = payment.phoneNumber;
    const name = payment.name;
    let message;

    if (payment.verifyLog === 'verified') {
      message = `Dear ${name},\n\nYour payment has been verified successfully!\n\nPayment Details:\n- Payment Id: ${payment.paymentId}\n- Amount: ₹${payment.amount}\n- Date: ${formatDate(payment.createdAt)}\n- Transaction Status: ${payment.transactionStatus}\n- Payment Mode: Web App\n- Verification Status: ${payment.verifyLog}\n\nThank you for your contribution!\n\nBest regards,\nNBK Youth`;
    } else if (payment.verifyLog === 'rejected') {
      message = `Dear ${name},\n\nWe regret to inform you that your payment has been rejected.\n\nPayment Details:\n- Payment Id: ${payment.paymentId}\n- Amount: ₹${payment.amount}\n- Date: ${formatDate(payment.createdAt)}\n- Transaction Status: ${payment.transactionStatus}\n- Payment Mode: Web App\n- Verification Status: ${payment.verifyLog}\n\nPlease contact the administrator for more details.\n\nBest regards,\nNBK Youth`;
    }

    const url = `https://wa.me/${countryCode}${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getWhatsAppIconColor = (payment) => {
    if (!payment.phoneNumber) return 'text-gray-300';
    return payment.verifyLog === 'verified' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700';
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment._id);
    setEditForm({
      name: payment.name,
      belongsTo: payment.belongsTo
    });
  };

  const handleSave = async (paymentId) => {
    try {
      await onUpdatePayment(paymentId, editForm);
      setEditingPayment(null);
      toast.success('Payment details updated successfully');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        toast.error('Name already exists in income records. Please use a different name.');
      } else {
        toast.error('Failed to update payment details');
      }
    }
  };

  const handleVerify = async (paymentId) => {
    if (window.confirm('This will create a new income entry. Are you sure?')) {
      try {
        await onVerifyLogUpdate(paymentId, 'verified');
        toast.success('Payment verified and income entry created successfully');
      } catch (error) {
        if (error.response?.data?.existingName) {
          toast.error(`A user with name "${error.response.data.existingName}" already exists. Please update the name before verifying.`);
          handleEdit({ _id: paymentId, name: error.response.data.existingName });
        } else {
          toast.error('Failed to verify payment');
        }
      }
    }
  };

  const renderIncomeColumns = (item) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.incomeId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.email || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.status}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.belongsTo}</td>
    </>
  );

  const renderExpenseColumns = (item) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.expenseId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.purpose}</td>
      <td className="px-6 py-4">
        <button
          onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          {expandedRow === item._id ? 'Hide' : 'Show'} Details
        </button>
        {expandedRow === item._id && (
          <div className="mt-2 space-y-2">
            {item.subExpenses.map((sub, idx) => (
              <div key={idx} className="text-sm">
                <div>Purpose: {sub.subPurpose}</div>
                <div>Amount: {sub.subAmount}</div>
                {sub.billImage && (
                  <img
                    src={sub.billImage}
                    alt="Bill"
                    className="h-16 w-16 object-cover rounded mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amountReturned || 0}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentMode}</td>
    </>
  );

  const renderPaymentColumns = (item) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.paymentId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.registerId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {editingPayment === item._id ? (
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        ) : (
          item.name
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.email || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.phoneNumber}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.amount}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {editingPayment === item._id ? (
          <select
            value={editForm.belongsTo}
            onChange={(e) => setEditForm({ ...editForm, belongsTo: e.target.value })}
            className="w-full border rounded px-2 py-1"
          >
            <option value="villagers">Villagers</option>
            <option value="youth">Youth</option>
          </select>
        ) : (
          item.belongsTo
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <a
          href={item.screenshot}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-900"
        >
          View Screenshot
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.transactionStatus === 'successful' ? 'bg-green-100 text-green-800' :
          item.transactionStatus === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {item.transactionStatus}
        </span>
      </td>
    </>
  );

  const renderTableHeaders = () => {
    if (type === 'income') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      );
    } else if (type === 'expense') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Expenses</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Returned</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      );
    } else {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belongs To</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {renderTableHeaders()}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              {type === 'income' && renderIncomeColumns(item)}
              {type === 'expense' && renderExpenseColumns(item)}
              {type === 'payment' && renderPaymentColumns(item)}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerifyLogColor(item.verifyLog)}`}>
                  {item.verifyLog}
                </span>
                {type === 'payment' && (item.verifyLog === 'verified' || item.verifyLog === 'rejected') && (
                  <button
                    onClick={() => item.phoneNumber && sendWhatsAppMessage(item)}
                    disabled={!item.phoneNumber}
                    className={`${getWhatsAppIconColor(item)} transition-colors duration-200`}
                    title={item.phoneNumber ? 'Send WhatsApp message' : 'No phone number available'}
                  >
                    <FaWhatsapp className="h-5 w-5" />
                  </button>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex space-x-2">
                {type === 'payment' && item.verifyLog !== 'verified' && (
                  <>
                    {editingPayment === item._id ? (
                      <button
                        onClick={() => handleSave(item._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Save"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => type === 'payment' ? handleVerify(item._id) : onVerifyLogUpdate(item._id, 'verified')}
                  className="text-green-600 hover:text-green-900"
                  title="Verify"
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onVerifyLogUpdate(item._id, 'not verified')}
                  className="text-yellow-600 hover:text-yellow-900"
                  title="Mark as Not Verified"
                >
                  <AlertCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onVerifyLogUpdate(item._id, 'rejected')}
                  className="text-red-600 hover:text-red-900"
                  title="Reject"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}

export default VerificationTable;