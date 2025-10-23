import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EVENT_OPTIONS = ['Sankranti', 'Ganesh Chaturthi'];
const STATUS_OPTIONS = ['Conducted', 'Not Conducted'];

function FinancialRecordForm({ record, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    eventName: '',
    customEventName: '',
    year: new Date().getFullYear(),
    status: 'Conducted',
    amountLeft: '',
    maturityAmount: '',
    fdStartDate: '',
    fdMaturityDate: '',
    fdAccount: '',
    remarks: ''
  });
  const [showFdDetails, setShowFdDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate year options (2023 to next year)
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
        status: record.status || 'Conducted',
        amountLeft: record.amountLeft?.toString() || '',
        maturityAmount: record.maturityAmount?.toString() || '',
        fdStartDate: record.fdStartDate ? record.fdStartDate.split('T')[0] : '',
        fdMaturityDate: record.fdMaturityDate ? record.fdMaturityDate.split('T')[0] : '',
        fdAccount: record.fdAccount || '',
        remarks: record.remarks || ''
      });

      // If FD details already exist, auto enable checkbox
      if (record.fdStartDate || record.fdMaturityDate || record.fdAccount) {
        setShowFdDetails(true);
      }
    }
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalEventName =
        formData.eventName === 'Other' ? formData.customEventName : formData.eventName;

      if (!finalEventName.trim()) {
        throw new Error('Event name is required');
      }

      const submitData = {
        eventName: finalEventName,
        year: parseInt(formData.year),
        status: formData.status,
        amountLeft: parseFloat(formData.amountLeft) || 0,
        maturityAmount: parseFloat(formData.maturityAmount) || 0,
        fdStartDate: showFdDetails ? formData.fdStartDate || null : null,
        fdMaturityDate: showFdDetails ? formData.fdMaturityDate || null : null,
        fdAccount: showFdDetails ? formData.fdAccount || '' : '',
        remarks: formData.remarks.trim() || ''
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
              {EVENT_OPTIONS.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
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
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
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
            <label className="block text-sm font-medium text-gray-700">Maturity Amount *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.maturityAmount}
              onChange={(e) => setFormData({ ...formData, maturityAmount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Checkbox for FD details */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showFdDetails}
              onChange={(e) => setShowFdDetails(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">FD Details</label>
          </div>

          {/* FD Details (conditionally rendered) */}
{showFdDetails && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          FD Start Date
        </label>
        <input
          type="date"
          value={formData.fdStartDate}
          onChange={(e) => setFormData({ ...formData, fdStartDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          FD Maturity Date
        </label>
        <input
          type="date"
          value={formData.fdMaturityDate}
          onChange={(e) => setFormData({ ...formData, fdMaturityDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">
        FD Account
      </label>
      <input
        type="text"
        value={formData.fdAccount}
        onChange={(e) => setFormData({ ...formData, fdAccount: e.target.value })}
        placeholder="Details"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </div>
  </>
)}

<div>
  <textarea
    value={formData.remarks}
    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
    placeholder="Remarks"
    rows={1}
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
              {isSubmitting
                ? record
                  ? 'Updating...'
                  : 'Adding...'
                : record
                ? 'Update'
                : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinancialRecordForm;
