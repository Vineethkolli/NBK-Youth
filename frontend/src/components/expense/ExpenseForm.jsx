import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function ExpenseForm({ expense, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    amount: '',
    purpose: '',
    paymentMode: 'cash',
    amountReturned: '0',
    subExpenses: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isBalanced, setIsBalanced] = useState(true);

  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        phoneNumber: expense.phoneNumber || '',
        amount: expense.amount,
        purpose: expense.purpose,
        paymentMode: expense.paymentMode,
        amountReturned: expense.amountReturned || '0',
        subExpenses: expense.subExpenses?.length > 0 
          ? expense.subExpenses 
          : []
      });
    }
  }, [expense]);

  useEffect(() => {
    if (expense) {
      checkBalance();
    }
  }, [formData.subExpenses, formData.amount, formData.amountReturned]);

  const checkBalance = () => {
    const subExpensesTotal = formData.subExpenses.reduce(
      (sum, item) => sum + Number(item.subAmount || 0),
      0
    );
    const netAmount = Number(formData.amount) - Number(formData.amountReturned);
    setIsBalanced(Math.abs(subExpensesTotal - netAmount) <= 0.01);
  };

  const handleSubExpenseChange = (index, field, value) => {
    const updatedSubExpenses = [...formData.subExpenses];
    updatedSubExpenses[index] = {
      ...updatedSubExpenses[index],
      [field]: value
    };
    setFormData({ ...formData, subExpenses: updatedSubExpenses });
  };

  const handleAddSubExpense = () => {
    setFormData({
      ...formData,
      subExpenses: [
        ...formData.subExpenses,
        { subPurpose: '', subAmount: '', billImage: '' }
      ]
    });
  };

  const handleRemoveSubExpense = (index) => {
    const updatedSubExpenses = formData.subExpenses.filter((_, i) => i !== index);
    setFormData({ ...formData, subExpenses: updatedSubExpenses });
  };

  const handleBillUpload = async (index, file) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      return toast.error('File size should be less than 15MB');
    }

    if (!file.type.startsWith('image/')) {
      return toast.error('Only image files are allowed');
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        handleSubExpenseChange(index, 'billImage', reader.result);
      };
    } catch (error) {
      toast.error('Failed to upload bill image');
    }
  };

  const validateInitialForm = () => {
    if (Number(formData.amount) <= 0) {
      toast.error('Amount taken must be greater than 0');
      return false;
    }
    return true;
  };

  const validateFullForm = () => {
    if (Number(formData.amountReturned) < 0) {
      toast.error('Amount returned cannot be negative');
      return false;
    }

    if (Number(formData.amountReturned) > Number(formData.amount)) {
      toast.error('Amount returned cannot be greater than amount taken');
      return false;
    }

    if (!isBalanced) {
      toast.error('Sum of sub-expenses must equal total amount minus returned amount');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; 
    setIsSubmitting(true);

    try {
      if (!expense && !validateInitialForm()) throw new Error('Validation failed');
      if (expense && !validateFullForm()) throw new Error('Validation failed');

      if (expense) {
        await axios.put(`${API_URL}/api/expenses/${expense._id}`, {
          ...formData,
          registerId: user.registerId,
        });
        toast.success('Expense updated successfully');
      } else {
        await axios.post(`${API_URL}/api/expenses`, {
          ...formData,
          registerId: user.registerId,
        });
        toast.success('Expense added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {expense ? 'Update Expense' : 'Add New Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          {/*  <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                pattern="^[\+\-\d\s\(\)]*$"  
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Taken *</label>
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
              <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          {expense && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Returned</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountReturned}
                    onChange={(e) => setFormData({ ...formData, amountReturned: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {isBalanced ? 'Balanced' : 'Not Balanced'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sub Expenses</h3>
                  <button
                    type="button"
                    onClick={handleAddSubExpense}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-md"
                  >
                    Add Sub Expense
                  </button>
                </div>

                {formData.subExpenses.map((subExpense, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 items-center border p-4 rounded-md"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sub Purpose</label>
                      <input
                        type="text"
                        value={subExpense.subPurpose}
                        onChange={(e) =>
                          handleSubExpenseChange(index, 'subPurpose', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sub Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subExpense.subAmount}
                        onChange={(e) =>
                          handleSubExpenseChange(index, 'subAmount', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bill Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBillUpload(index, e.target.files[0])}
                        className="mt-1 block w-full"
                      />
                      {subExpense.billImage && (
                        <img
                          src={subExpense.billImage}
                          alt="Uploaded Bill"
                          className="mt-2 h-16 w-16 object-cover rounded-md"
                        />
                      )}
                    </div>
                    <div className="col-span-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubExpense(index)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md"
                      >
                        <Trash2 className="h-5 w-5 inline-block" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

            <div className="space-x-2 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-300  hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-indigo-500 text-white px-6 py-2 rounded-md ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : expense ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;