import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EVENT_OPTIONS = ['Sankranti', 'Ganesh Chaturthi'];

function FinancialRecordForm({ record, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    eventName: '',
    customEventName: '',
    year: new Date().getFullYear(),
    amountLeft: '',
    maturityAmount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate year options  (2023 to next year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = 2023; year <= currentYear + 1; year++) {
    yearOptions.push(year);
  }

  useEffect(() => {
    if (record) {
      setFormData({
        eventName: EVENT_OPTIONS.includes(record.eventName) ? record.eventName : 'Other',
        customEventName: EVENT_OPTIONS.includes(record.eventName) ? '' : record.eventName,
        year: record.year,
        amountLeft: record.amountLeft.toString(),
        maturityAmount: record.maturityAmount.toString()
      });
    }
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalEventName = formData.eventName === 'Other' ? formData.customEventName : formData.eventName;
      
      if (!finalEventName.trim()) {
        throw new Error('Event name is required');
      }

      const submitData = {
        eventName: finalEventName,
        year: parseInt(formData.year),
        amountLeft: parseFloat(formData.amountLeft) || 0,
        maturityAmount: parseFloat(formData.maturityAmount) || 0
      };

      await onSubmit(submitData);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {record ? 'Edit Financial Record' : 'Add Financial Record'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name *</label>
            <select
              required
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Event</option>
              {EVENT_OPTIONS.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.eventName === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Event Name *</label>
              <input
                type="text"
                required
                value={formData.customEventName}
                onChange={(e) => setFormData({ ...formData, customEventName: e.target.value })}
                placeholder="Enter event name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Year *</label>
            <select
              required
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount Left *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amountLeft}
              onChange={(e) => setFormData({ ...formData, amountLeft: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maturity Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.maturityAmount}
              onChange={(e) => setFormData({ ...formData, maturityAmount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
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
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (record ? 'Updating...' : 'Creating...') : (record ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinancialRecordForm;