import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Database, X, Play, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function ProcessedDataManager() {
  const [processedRecords, setProcessedRecords] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingRecord, setProcessingRecord] = useState(null);
  const [formData, setFormData] = useState({
    snapshotId: '',
    selectedCollections: []
  });

  useEffect(() => {
    fetchProcessedRecords();
    fetchSnapshots();
  }, []);

  const fetchProcessedRecords = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/vini/processed-records`);
      setProcessedRecords(data);
    } catch (error) {
      toast.error('Failed to fetch processed records');
    }
  };

  const fetchSnapshots = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/snapshots`);
      setSnapshots(data);
    } catch (error) {
      toast.error('Failed to fetch snapshots');
    }
  };

  const getSelectedSnapshot = () => {
    return snapshots.find(s => s._id === formData.snapshotId);
  };

  const getAvailableCollections = () => {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return [];

    const collections = [];
    Object.keys(snapshot.collections).forEach(key => {
      if (snapshot.collections[key] && snapshot.collections[key].length > 0) {
        collections.push(key);
      }
    });

    // Add Stats if it exists
    if (snapshot.stats && Object.keys(snapshot.stats).length > 0) {
      collections.push('Stats');
    }

    return collections;
  };

  const handleCollectionToggle = (collection) => {
    setFormData(prev => ({
      ...prev,
      selectedCollections: prev.selectedCollections.includes(collection)
        ? prev.selectedCollections.filter(c => c !== collection)
        : [...prev.selectedCollections, collection]
    }));
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (formData.selectedCollections.length === 0) {
      toast.error('Please select at least one collection');
      return;
    }

    try {
      const snapshot = getSelectedSnapshot();
      await axios.post(`${API_URL}/api/vini/processed-records`, {
        snapshotId: formData.snapshotId,
        eventName: snapshot.eventName,
        year: snapshot.year,
        selectedCollections: formData.selectedCollections
      });

      toast.success('Processed record created successfully');
      setShowAddForm(false);
      setFormData({ snapshotId: '', selectedCollections: [] });
      fetchProcessedRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create processed record');
    }
  };

  const handleProcess = async (record) => {
    setIsProcessing(true);
    setProcessingRecord(record._id);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/process-record/${record._id}`);
      toast.success(`Data processed successfully! ${data.chunkCount} chunks created.`);
      fetchProcessedRecords();
    } catch (error) {
      toast.error('Failed to process data');
    } finally {
      setIsProcessing(false);
      setProcessingRecord(null);
    }
  };

  const handleReprocess = async (record) => {
    if (!window.confirm(`Reprocess data for ${record.eventName} ${record.year}?`)) return;
    
    setIsProcessing(true);
    setProcessingRecord(record._id);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/reprocess-record/${record._id}`);
      toast.success(`Data reprocessed successfully! ${data.chunkCount} chunks created.`);
      fetchProcessedRecords();
    } catch (error) {
      toast.error('Failed to reprocess data');
    } finally {
      setIsProcessing(false);
      setProcessingRecord(null);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Are you sure you want to delete this processed record?')) return;

    try {
      await axios.delete(`${API_URL}/api/vini/processed-records/${record._id}`);
      toast.success('Processed record deleted successfully');
      fetchProcessedRecords();
    } catch (error) {
      toast.error('Failed to delete processed record');
    }
  };

  const getStatusColor = (status, recordId) => {
    if (processingRecord === recordId) return 'text-orange-600';
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'processing': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status, recordId) => {
    if (processingRecord === recordId) return 'Processing...';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderActionButton = (record) => {
    if (record.status === 'uploaded') {
      return (
        <button
          onClick={() => handleProcess(record)}
          disabled={isProcessing}
          className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          title="Process"
        >
          <Play className="h-4 w-4 mr-1" />
          Process
        </button>
      );
    } else if (record.status === 'ready') {
      return (
        <button
          onClick={() => handleReprocess(record)}
          disabled={isProcessing}
          className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          title="Reprocess"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reprocess
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          Processed Data
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center px-4 py-2 rounded-md ${
              isEditMode ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Processed Records List */}
      <div className="space-y-4">
        {processedRecords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No processed records yet</p>
          </div>
        ) : (
          processedRecords.map((record) => (
            <div key={record._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">{record.eventName} {record.year}</h3>
                    <p className="text-sm text-gray-500">
                      Chunks: {record.chunksCount || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${getStatusColor(record.status, record._id)}`}>
                    {getStatusText(record.status, record._id)}
                  </span>
                  <div className="flex items-center space-x-2">
                    {renderActionButton(record)}
                    {isEditMode && (
                      <button
                        onClick={() => handleDelete(record)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Processed Record</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Snapshot Name *</label>
                <select
                  required
                  value={formData.snapshotId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    snapshotId: e.target.value,
                    selectedCollections: [] // Reset collections when snapshot changes
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Snapshot</option>
                  {snapshots.map(snapshot => (
                    <option key={snapshot._id} value={snapshot._id}>
                      {snapshot.eventName} {snapshot.year}
                    </option>
                  ))}
                </select>
              </div>

              {formData.snapshotId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collections *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {getAvailableCollections().map(collection => (
                      <label key={collection} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedCollections.includes(collection)}
                          onChange={() => handleCollectionToggle(collection)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">{collection}</span>
                      </label>
                    ))}
                  </div>
                  {getAvailableCollections().length === 0 && (
                    <p className="text-sm text-gray-500">No collections available in this snapshot</p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessedDataManager;