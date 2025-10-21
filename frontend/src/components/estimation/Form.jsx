import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function EstimationForm({ type, mode, data, onSubmit, onClose }) {
  const initialState = type === 'income'
    ? {
        name: '',
        previousAmount: '',
        presentAmount: '',
        belongsTo: 'youth',    
        status: 'not paid',    
        others: ''
      }
    : {
        purpose: '',
        previousAmount: '',
        presentAmount: '',
        contact: '',
        others: ''
      };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setFormData(data);
    } else {
      setFormData(initialState);
    }
  }, [mode, data, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'add' ? 'Add' : 'Edit'} {type === 'income' ? 'Income' : 'Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'income' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name<span className="text-black-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Previous Amount</label>
                <input
                  type="number"
                  name="previousAmount"
                  value={formData.previousAmount}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Present Amount</label>
                <input
                  type="number"
                  name="presentAmount"
                  value={formData.presentAmount}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Belongs to</label>
                <select
                  name="belongsTo"
                  value={formData.belongsTo}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                >
                  <option value="youth">Youth</option>
                  <option value="villagers">Villagers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                >
                  <option value="not paid">Not Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Others</label>
                <input
                  type="text"
                  name="others"
                  value={formData.others}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose<span className="text-black-500">*</span></label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Previous Amount</label>
                <input
                  type="number"
                  name="previousAmount"
                  value={formData.previousAmount}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Present Amount</label>
                <input
                  type="number"
                  name="presentAmount"
                  value={formData.presentAmount}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Others</label>
                <input
                  type="text"
                  name="others"
                  value={formData.others}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">
              {mode === 'add' ? 'Add' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EstimationForm;
