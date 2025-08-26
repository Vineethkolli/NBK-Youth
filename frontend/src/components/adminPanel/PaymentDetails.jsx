import { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function PaymentDetails({ onUpdate }) {
  const [paymentDetails, setPaymentDetails] = useState({
    upiNumber: '',
    upiId: '',
    accountHolder: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...paymentDetails });

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/payment-details`);
      setPaymentDetails(data);
      setEditForm(data);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      toast.error('Failed to fetch payment details');
    }
  };

  const handleSave = async () => {
    try {
      const { data } = await axios.put(`${API_URL}/api/payment-details`, editForm);
      setPaymentDetails(data);
      setIsEditing(false);
      toast.success('Payment details updated successfully');
      if (onUpdate) {
        onUpdate(data);
      }
    } catch (error) {
      toast.error('Failed to update payment details');
    }
  };

  const handleCancel = () => {
    setEditForm({ ...paymentDetails });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Payment Details</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-grey-700"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI Number
              </label>
              <input
                type="text"
                value={editForm.upiNumber}
                onChange={(e) => setEditForm({ ...editForm, upiNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={editForm.upiId}
                onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={editForm.accountHolder}
                onChange={(e) => setEditForm({ ...editForm, accountHolder: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">UPI Number</p>
              <p className="font-medium">{paymentDetails.upiNumber}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">UPI ID</p>
              <p className="font-medium">{paymentDetails.upiId}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Account Holder Name</p>
              <p className="font-medium">{paymentDetails.accountHolder}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentDetails;
