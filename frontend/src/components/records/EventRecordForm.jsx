import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const EVENT_OPTIONS = ['Sankranti', 'Ganesh Chaturthi'];

function EventRecordForm({ record, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    eventName: '',
    customEventName: '',
    recordYear: new Date().getFullYear(),
    file: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Generate year options (2023 → next year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = 2023; year <= currentYear + 1; year++) {
    yearOptions.push(year);
  }

  // Pre-fill form when editing
  useEffect(() => {
    if (record) {
      setFormData({
        eventName: EVENT_OPTIONS.includes(record.eventName)
          ? record.eventName
          : 'Other',
        customEventName: EVENT_OPTIONS.includes(record.eventName)
          ? ''
          : record.eventName,
        recordYear: record.recordYear,
        file: null, // no file prefilled, only replace if uploaded
      });
    }
  }, [record]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB');
      return;
    }

    setFormData({ ...formData, file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalEventName =
        formData.eventName === 'Other'
          ? formData.customEventName
          : formData.eventName;

      if (!finalEventName.trim()) {
        throw new Error('Event name is required');
      }

      if (!record && !formData.file) {
        throw new Error('Please select a PDF file');
      }

      const submitData = new FormData();
      submitData.append('eventName', finalEventName);
      submitData.append('recordYear', formData.recordYear);

      if (formData.file) {
        submitData.append('file', formData.file);
      }
      await onSubmit(submitData);

      // Reset file input after success
      setFileInputKey(Date.now());
      setFormData((prev) => ({ ...prev, file: null }));
    } catch (error) {
      console.error(error);
      alert(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {record ? 'Edit Event Record' : 'Add Event Record'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Event Name *
            </label>
            <select
              required
              value={formData.eventName}
              onChange={(e) =>
                setFormData({ ...formData, eventName: e.target.value })
              }
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

          {/* Custom Event Name */}
          {formData.eventName === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Custom Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.customEventName}
                onChange={(e) =>
                  setFormData({ ...formData, customEventName: e.target.value })
                }
                placeholder="Enter event name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Record Year *
            </label>
            <select
              required
              value={formData.recordYear}
              onChange={(e) =>
                setFormData({ ...formData, recordYear: parseInt(e.target.value) })
              }
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
            <label className="block text-sm font-medium text-gray-700">
              {record ? 'Update PDF File' : 'Upload PDF File *'}
            </label>

            <input
              key={fileInputKey}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              required={!record} // required only when adding new
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
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {record ? 'Updating...' : 'Uploading...'}
                </>
              ) : record ? (
                'Update'
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventRecordForm;
