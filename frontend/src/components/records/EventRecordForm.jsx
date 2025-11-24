import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const EVENT_OPTIONS = ['Sankranti', 'Ganesh Chaturthi'];

function EventRecordForm({ record, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    eventName: '',
    customEventName: '',
    recordYear: new Date().getFullYear(),
    fileEnglish: null,
    fileTelugu: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [uploadProgress, setUploadProgress] = useState(0);

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
        fileEnglish: null, 
        fileTelugu: null,
      });
    }
  }, [record]);

  const handleFileChange = (e, lang) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    if (file.size > 90 * 1024 * 1024) {
      alert('File size should be less than 90MB');
      return;
    }

    if (lang === 'english') setFormData({ ...formData, fileEnglish: file });
    else setFormData({ ...formData, fileTelugu: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const finalEventName =
        formData.eventName === 'Other'
          ? formData.customEventName
          : formData.eventName;

      if (!finalEventName.trim()) {
        throw new Error('Event name is required');
      }

      // Require at least one file (English or Telugu) when creating a new record
      if (!record && !formData.fileEnglish && !formData.fileTelugu) {
        toast.error('Select atleast one English or Telugu pdf');
        setIsSubmitting(false);
        return;
      }

      // Check uniqueness before uploading to Cloudinary 
try {
  await api.post(`/api/records/event-records/check`, {
    eventName: finalEventName,
    recordYear: formData.recordYear,
    recordId: record?._id || null, 
  });
} catch (err) {
  const msg = err?.response?.data?.message || 'Event record already exists';
  toast.error(msg);
  setIsSubmitting(false);
  return;
}

      let englishMeta = null;
      let teluguMeta = null;

      const totalSize = (formData.fileEnglish ? formData.fileEnglish.size : 0) + (formData.fileTelugu ? formData.fileTelugu.size : 0);

      const uploadProgressCombined = (englishPart, teluguPart) => {
        const engSize = formData.fileEnglish ? formData.fileEnglish.size : 0;
        const telSize = formData.fileTelugu ? formData.fileTelugu.size : 0;
        const engWeight = totalSize > 0 ? engSize / totalSize : 0.5;
        const telWeight = totalSize > 0 ? telSize / totalSize : 0.5;
        const engPct = englishPart || 0;
        const telPct = teluguPart || 0;
        const combined = Math.round(engPct * engWeight + telPct * telWeight);
        setUploadProgress(combined);
      };

      if (formData.fileEnglish) {
        englishMeta = await uploadDirectToCloudinary({
          file: formData.fileEnglish,
          folder: 'EventRecords',
          resourceType: 'raw',
          onProgress: (p) => uploadProgressCombined(p, null),
        });
      } else if (record) {
      }

      if (formData.fileTelugu) {
        teluguMeta = await uploadDirectToCloudinary({
          file: formData.fileTelugu,
          folder: 'EventRecords',
          resourceType: 'raw',
          onProgress: (p) => uploadProgressCombined(null, p),
        });
      }

      const payload = {
        eventName: finalEventName,
        recordYear: formData.recordYear,
      };
      if (englishMeta) {
        payload.fileUrlEnglish = englishMeta.url;
        payload.filePublicIdEnglish = englishMeta.publicId;
      }
      if (teluguMeta) {
        payload.fileUrlTelugu = teluguMeta.url;
        payload.filePublicIdTelugu = teluguMeta.publicId;
      }
      await onSubmit(payload);

  // Reset file input after success
  setFileInputKey(Date.now());
  setFormData((prev) => ({ ...prev, fileEnglish: null, fileTelugu: null }));
    } catch (error) {
      console.error(error);
      alert(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload English PDF</label>
              <input
                key={fileInputKey + '-eng'}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, 'english')}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Telugu PDF </label>
              <input
                key={fileInputKey + '-tel'}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, 'telugu')}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
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
  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center ${
    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isSubmitting ? (
    <>
      <Upload className="h-4 w-4 mr-2 animate-spin" />
      {record ? 'Updating' : 'Uploading'}
      {uploadProgress > 0 && <span className="ml-2 text-sm text-white">{uploadProgress}%</span>}
      ...
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
