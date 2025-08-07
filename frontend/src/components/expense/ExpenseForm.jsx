import { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { nanoid } from 'nanoid';

function ExpenseForm({ expense, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    amount: '',
    purpose: '',
    paymentMode: 'cash',
    amountReturned: '0',
    subExpenses: [],
    deletedSubExpenses: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);
  const fileInputRefs = useRef({});

  // Initialize form in edit mode
  useEffect(() => {
    if (expense) {
      setFormData(prev => ({
        ...prev,
        name: expense.name,
        phoneNumber: expense.phoneNumber || '',
        amount: String(expense.amount),
        purpose: expense.purpose,
        paymentMode: expense.paymentMode,
        amountReturned: String(expense.amountReturned || '0'),
        subExpenses: (expense.subExpenses || []).map(sub => ({
          ...sub,
          tempId: sub._id,
          subAmount: String(sub.subAmount),
          billImage: null,
          billImagePreview: sub.billImage || ''
        })),
        deletedSubExpenses: []
      }));
    }
  }, [expense]);

  // Balance check
  useEffect(() => {
    const subTotal = formData.subExpenses.reduce(
      (sum, s) => sum + Number(s.subAmount || 0), 0
    );
    const net = Number(formData.amount) - Number(formData.amountReturned);
    setIsBalanced(Math.abs(subTotal - net) < 0.01);
  }, [formData.subExpenses, formData.amount, formData.amountReturned]);

  const handleSubExpenseChange = (tempId, field, value) => {
    setFormData(prev => ({
      ...prev,
      subExpenses: prev.subExpenses.map(s =>
        s.tempId === tempId ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleAddSubExpense = () => {
    const newTempId = nanoid();
    setFormData(prev => ({
      ...prev,
      subExpenses: [
        ...prev.subExpenses,
        { tempId: newTempId, subPurpose: '', subAmount: '', billImage: null, billImagePreview: '' }
      ]
    }));
  };

  const handleRemoveSubExpense = tempId => {
    setFormData(prev => {
      const removed = prev.subExpenses.find(s => s.tempId === tempId);
      const updated = prev.subExpenses.filter(s => s.tempId !== tempId);
      const del = removed && removed._id ? [...prev.deletedSubExpenses, removed._id] : prev.deletedSubExpenses;
      return { ...prev, subExpenses: updated, deletedSubExpenses: del };
    });
    // clear file input
    if (fileInputRefs.current[tempId]) {
      fileInputRefs.current[tempId].value = '';
    }
  };

  const handleBillUpload = (tempId, file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast.error('File must be <15MB');
    if (!file.type.startsWith('image/')) return toast.error('Only images allowed');

    setFormData(prev => ({
      ...prev,
      subExpenses: prev.subExpenses.map(s =>
        s.tempId === tempId
          ? { ...s, billImage: file, billImagePreview: URL.createObjectURL(file) }
          : s
      )
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // basic validation
      if (!expense && Number(formData.amount) <= 0) throw new Error('Amount must be >0');
      if (expense && !isBalanced) throw new Error('Sub-expenses must balance');

      const data = new FormData();
      ['name', 'phoneNumber', 'amount', 'purpose', 'paymentMode', 'amountReturned'].forEach(key => {
        data.append(key, formData[key]);
      });
      data.append('registerId', user.registerId);

      // prepare subExpenses payload
      formData.subExpenses.forEach((s, idx) => {
        data.append(
          'subExpenses',
          JSON.stringify({
            _id: s._id,
            tempId: s.tempId,
            subPurpose: s.subPurpose,
            subAmount: s.subAmount
          })
        );
        if (s.billImage instanceof File) {
          data.append(`billImage_${s.tempId}`, s.billImage);
        }
      });
      if (formData.deletedSubExpenses.length) {
        data.append('deletedSubExpenses', JSON.stringify(formData.deletedSubExpenses));
      }

      if (expense) {
        await axios.put(`${API_URL}/api/estimation/expense/${expense._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense updated');
      } else {
        await axios.post(`${API_URL}/api/estimation/expense`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense added');
      }

      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {expense ? 'Update Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Spender Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Amount Taken *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Purpose *</label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          {/* Sub-Expenses */}
          {expense && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Sub-Expenses</h3>
                <button
                  type="button"
                  onClick={handleAddSubExpense}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-md"
                >
                  <Plus className="inline h-4 w-4 mr-1" />Add
                </button>
              </div>

              <div className="space-y-4">
                {formData.subExpenses.map(s => (
                  <div key={s.tempId} className="grid grid-cols-4 gap-4 p-4 border rounded-md">
                    <div>
                      <label className="text-sm font-medium">Sub Purpose</label>
                      <input
                        type="text"
                        value={s.subPurpose}
                        onChange={e => handleSubExpenseChange(s.tempId, 'subPurpose', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sub Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={s.subAmount}
                        onChange={e => handleSubExpenseChange(s.tempId, 'subAmount', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bill Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={el => (fileInputRefs.current[s.tempId] = el)}
                        onChange={e => handleBillUpload(s.tempId, e.target.files[0])}
                        className="mt-1 block w-full"
                      />
                      {s.billImagePreview && (
                        <div className="relative mt-2 h-16 w-24">
                          <img
                            src={s.billImagePreview}
                            alt="Bill Preview"
                            className="h-full w-full object-contain border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleBillUpload(s.tempId, null)}
                            className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubExpense(s.tempId)}
                        className="bg-red-500 text-white p-2 rounded-md"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                  {isBalanced ? 'Balanced' : 'Not Balanced'}
                </span>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="text-right space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-500 text-white rounded-md"
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
