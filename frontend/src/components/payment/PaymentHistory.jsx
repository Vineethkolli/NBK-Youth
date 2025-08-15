import { toast } from 'react-hot-toast';
import { Download } from 'lucide-react';
import { generatePaymentReceipt } from '../../utils/paymentReceipt';
import { formatDateTime } from '../../utils/dateTime';

function PaymentHistory({ payments }) {

  const getStatusColor = (status) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getVerificationColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleDownloadReceipt = (payment) => {
    try {
      generatePaymentReceipt(payment).then((doc) => {
        doc.save(`NBK_Youth_Payment_${payment.paymentId}.pdf`);
        toast.success('Receipt downloaded successfully');
      }).catch((error) => {
        console.error('Failed to generate receipt:', error);
        toast.error('Failed to download receipt');
      });
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Payment History</h2>
      {payments.length === 0 ? (
        <p className="text-center text-gray-500">No payment history available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verify Log</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-6 py-4 text-sm flex items-center whitespace-nowrap">
                    <button
                      onClick={() => handleDownloadReceipt(payment)}
                      className="mr-2 text-gray-600 hover:text-gray-900"
                      title="Download Receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {payment.paymentId}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {formatDateTime(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {payment.name}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    ₹{payment.amount}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <a
                      href={payment.screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.transactionStatus)}`}>
                      {payment.transactionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationColor(payment.verifyLog)}`}>
                      {payment.verifyLog}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
