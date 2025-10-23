import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function IncomeForm({ income, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    amount: '',
    status: 'not paid',
    paymentMode: 'cash',
    belongsTo: 'villagers',
  });

  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    if (income) {
      setFormData({
        name: income.name,
        email: income.email || '',
        phoneNumber: income.phoneNumber,
        amount: income.amount,
        status: income.status,
        paymentMode: income.paymentMode,
        belongsTo: income.belongsTo,
      });
    }
  }, [income]);

  const handleNameChange = async (value) => {
    setFormData({ ...formData, name: value });
    if (!income || income.name !== value) {
      try {
        await axios.post(`${API_URL}/api/incomes/check-name`, { name: value });
        setNameError('');
      } catch (error) {
        if (error.response?.status === 400) {
          setNameError('Name already exists');
        }
      }
    }
  };

  const handleStatusChange = (newStatus) => {
    setFormData({ ...formData, status: newStatus });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nameError) {
      toast.error('Please resolve errors before submitting the form');
      return;
    }

    setIsSubmitting(true);
    try {
      if (income) {
        await axios.put(`${API_URL}/api/incomes/${income._id}`, {
          ...formData,
          registerId: user.registerId,
        });
        toast.success('Income updated successfully');
      } else {
        // For new income, if status is paid, backend will automatically set paidDate
        await axios.post(`${API_URL}/api/incomes`, {
          ...formData,
          registerId: user.registerId,
        });
        toast.success('Income added successfully');
      }
      onSuccess();
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message === 'Name must be unique'
      ) {
        toast.error('The name you entered is already in use. Please use a different name.');
      } else {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {income ? 'Update Income' : 'Add New Income'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                nameError ? 'border-red-500' : ''
              }`}
            />
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </div>
{/*
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              pattern="^[\+\-\d\s\(\)]*$"  
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
*/}
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
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="paid">Paid</option>
              <option value="not paid">Not Paid</option>
            </select>
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
              <option value="web app">Web App</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Belongs To *</label>
            <select
              required
              value={formData.belongsTo}
              onChange={(e) => setFormData({ ...formData, belongsTo: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="villagers">Villagers</option>
              <option value="youth">Youth</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
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
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
  {isSubmitting ? (
    <>
      {income ? 'Updating...' : 'Adding...'}
    </>
  ) : (
    income ? 'Update' : 'Add'
  )}
</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IncomeForm;
