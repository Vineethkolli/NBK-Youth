import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { API_URL } from '../../utils/config';

function ExpenseForm({ expense, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    paymentMode: 'cash',
    name: '',
    phoneNumber: '',
    billImage: null,
    billImagePreview: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    if (expense) {
      setFormData({
        purpose: expense.purpose,
        amount: String(expense.amount),
        paymentMode: expense.paymentMode,
        name: expense.name,
        phoneNumber: expense.phoneNumber || '',
        billImage: null,
        billImagePreview: expense.billImage || null,
        billImageCloudinary: expense.billImage || null
      });
    }
  }, [expense]);

  const handleBillUpload = (file) => {
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error('File must be less than 30MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only images are allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      billImage: file,
      billImagePreview: URL.createObjectURL(file)
    }));
  };

  const clearBillImage = () => {
    setFormData(prev => ({
      ...prev,
      billImage: null,
      billImagePreview: null,
      billImageCloudinary: null
    }));
    setFileInputKey(Date.now());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let uploaded = null;
      if (formData.billImage instanceof File) {
        uploaded = await uploadDirectToCloudinary({
          file: formData.billImage,
          folder: 'ExpenseBills',
          resourceType: 'image',
          token: user?.token,
          onProgress: (p) => setUploadProgress(p),
        });
      }

      const payload = {
        purpose: formData.purpose,
        amount: formData.amount,
        paymentMode: formData.paymentMode,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        registerId: user.registerId,
      };

      if (uploaded) {
        payload.billImage = uploaded.url;
        payload.billImagePublicId = uploaded.publicId;
      }
      if (!formData.billImagePreview && expense && expense.billImage) {
        payload.deleteBillImage = 'true';
      }

      if (expense) {
        await axios.put(`${API_URL}/api/expenses/${expense._id}`, payload);
        toast.success('Expense updated successfully');
      } else {
        await axios.post(`${API_URL}/api/expenses`, payload);
        toast.success('Expense added successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {expense ? 'Update Expense' : 'Add New Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Purpose *</label>
            <input
              type="text"
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Mode *</label>
            <select
              required
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Spender Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bill</label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={(e) => handleBillUpload(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {formData.billImagePreview && (
              <div className="mt-2 relative inline-block">
                <img
                  src={formData.billImagePreview}
                  alt="Bill Preview"
                  className="h-20 w-20 object-cover border rounded"
                />
                <button
                  type="button"
                  onClick={clearBillImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
  type="submit"
  disabled={isSubmitting}
  className={`px-4 py-2 flex items-center justify-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isSubmitting ? (
    <>
      {expense ? 'Updating...' : 'Adding...'}
      {uploadProgress > 0 && <span className="ml-2 text-sm text-white">{uploadProgress}%</span>}
    </>
  ) : (
    expense ? 'Update' : 'Add'
  )}
</button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
