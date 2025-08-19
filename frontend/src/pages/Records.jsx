import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Edit2, Trash2, FileText, Play, RotateCcw, Eye, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { formatDateTime } from '../utils/dateTime';

function Records() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    recordYear: '',
    viewingFile: null,
    processingFile: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/records`);
      setRecords(data);
    } catch (error) {
      toast.error('Failed to fetch records');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.viewingFile || !formData.processingFile) {
      toast.error('Both viewing and processing files are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('fileName', formData.fileName);
      data.append('recordYear', formData.recordYear);
      data.append('viewingFile', formData.viewingFile);
      data.append('processingFile', formData.processingFile);

      if (editingRecord) {
        await axios.put(`${API_URL}/api/records/${editingRecord._id}`, {
          fileName: formData.fileName,
          recordYear: formData.recordYear
        });
        toast.success('Record updated successfully');
      } else {
        await axios.post(`${API_URL}/api/records`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Record uploaded successfully');
      }

      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      fileName: record.fileName,
      recordYear: record.recordYear,
      viewingFile: null,
      processingFile: null
    });
    setShowForm(true);
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete "${record.fileName}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/records/${record._id}`);
      toast.success('Record deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleProcess = async (recordId) => {
    setProcessingIds(prev => new Set(prev).add(recordId));
    try {
      await axios.post(`${API_URL}/api/records/${recordId}/process`);
      toast.success('File processing started');
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/records`);
          const updatedRecord = data.find(r => r._id === recordId);
          
          if (updatedRecord && updatedRecord.status !== 'processing') {
            setRecords(data);
            setProcessingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(recordId);
              return newSet;
            });
            clearInterval(pollInterval);
            
            if (updatedRecord.status === 'ready') {
              toast.success('File processed successfully');
            } else if (updatedRecord.status === 'error') {
              toast.error(`Processing failed: ${updatedRecord.errorMessage}`);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 3000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      }, 300000);

    } catch (error) {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
      toast.error('Failed to start processing');
    }
  };

  const handleReprocess = async (recordId) => {
    if (!window.confirm('Are you sure you want to reprocess this file?')) return;
    
    setProcessingIds(prev => new Set(prev).add(recordId));
    try {
      await axios.post(`${API_URL}/api/records/${recordId}/reprocess`);
      toast.success('File reprocessing started');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to start reprocessing');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fileName: '',
      recordYear: '',
      viewingFile: null,
      processingFile: null
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-red-100 text-red-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Records Management</h1>
        {isPrivilegedUser && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                resetForm();
                setEditingRecord(null);
                setShowForm(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{record.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.recordYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    {record.status === 'error' && record.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{record.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(record.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {record.processedDate ? formatDateTime(record.processedDate) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {/* View File */}
                      <button
                        onClick={() => window.open(record.viewingFileUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View File"
                      >
                        <Eye className="h-5 w-5" />
                      </button>

                      {/* Download Processing File */}
                      <button
                        onClick={() => window.open(record.processingFileUrl, '_blank')}
                        className="text-green-600 hover:text-green-900"
                        title="Download Processing File"
                      >
                        <Download className="h-5 w-5" />
                      </button>

                      {/* Process/Reprocess */}
                      {isPrivilegedUser && (
                        <>
                          {record.status === 'uploaded' && (
                            <button
                              onClick={() => handleProcess(record._id)}
                              disabled={processingIds.has(record._id)}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                              title="Process File"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}

                          {(record.status === 'ready' || record.status === 'error') && (
                            <button
                              onClick={() => handleReprocess(record._id)}
                              disabled={processingIds.has(record._id)}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Reprocess File"
                            >
                              <RotateCcw className="h-5 w-5" />
                            </button>
                          )}

                          {/* Edit/Delete in edit mode */}
                          {isEditMode && (
                            <>
                              <button
                                onClick={() => handleEdit(record)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingRecord ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">File Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Sankranti 2024 Records"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Record Year *</label>
                <input
                  type="text"
                  required
                  value={formData.recordYear}
                  onChange={(e) => setFormData({ ...formData, recordYear: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., 2024"
                />
              </div>

              {!editingRecord && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload for Viewing (PDF) *</label>
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(e) => setFormData({ ...formData, viewingFile: e.target.files[0] })}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload for Processing (Excel) *</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      required
                      onChange={(e) => setFormData({ ...formData, processingFile: e.target.files[0] })}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
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
                  {isSubmitting ? 'Uploading...' : (editingRecord ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Records;