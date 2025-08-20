import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Database, Calendar, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function HistoricalDataManager() {
  const [processedEvents, setProcessedEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingEvent, setProcessingEvent] = useState(null);
  const [formData, setFormData] = useState({
    eventName: '',
    year: new Date().getFullYear()
  });
  const [editData, setEditData] = useState({
    oldEventName: '',
    oldYear: '',
    newEventName: '',
    newYear: ''
  });

  useEffect(() => {
    fetchProcessedEvents();
  }, []);

  const fetchProcessedEvents = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/vini/processed-events`);
      setProcessedEvents(data);
    } catch (error) {
      toast.error('Failed to fetch processed events');
    }
  };

  const handleProcessData = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingEvent(`${formData.eventName}-${formData.year}`);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/process-data`, formData);
      toast.success(`Data processed successfully! ${data.chunkCount} chunks created.`);
      setShowAddForm(false);
      setFormData({ eventName: '', year: new Date().getFullYear() });
      fetchProcessedEvents();
    } catch (error) {
      toast.error('Failed to process data');
    } finally {
      setIsProcessing(false);
      setProcessingEvent(null);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/vini/processed-events`, editData);
      toast.success('Event updated successfully');
      setShowEditForm(false);
      fetchProcessedEvents();
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventName, year) => {
    if (!window.confirm(`Are you sure you want to delete all data for ${eventName} ${year}?`)) return;

    try {
      await axios.delete(`${API_URL}/api/vini/processed-events`, {
        data: { eventName, year }
      });
      toast.success('Event deleted successfully');
      fetchProcessedEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleReprocess = async (eventName, year) => {
    if (!window.confirm(`Reprocess data for ${eventName} ${year}?`)) return;
    
    setIsProcessing(true);
    setProcessingEvent(`${eventName}-${year}`);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/reprocess-event`, {
        eventName,
        year
      });
      toast.success(`Data reprocessed successfully! ${data.chunkCount} chunks created.`);
      fetchProcessedEvents();
    } catch (error) {
      toast.error('Failed to reprocess event');
    } finally {
      setIsProcessing(false);
      setProcessingEvent(null);
    }
  };

  const openEditForm = (event) => {
    setEditData({
      oldEventName: event.eventName,
      oldYear: event.year,
      newEventName: event.eventName,
      newYear: event.year
    });
    setShowEditForm(true);
  };

  const getStatusColor = (status, eventKey) => {
    if (processingEvent === eventKey) return 'text-orange-600';
    return status === 'ready' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (status, eventKey) => {
    if (processingEvent === eventKey) return 'Processing...';
    return status === 'ready' ? 'Ready' : 'Processing';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Historical Records Data
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
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Processed Events List */}
      <div className="space-y-4">
        {processedEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No historical data processed yet</p>
            <p className="text-sm">Click "Add" to process current data into historical records</p>
          </div>
        ) : (
          processedEvents.map((event) => {
            const eventKey = `${event.eventName}-${event.year}`;
            return (
              <div key={eventKey} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-medium">{event.eventName}</h3>
                    <p className="text-sm text-gray-500">
                      Year: {event.year} • {event.chunkCount} chunks • Created by {event.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${getStatusColor(event.status, eventKey)}`}>
                    {getStatusText(event.status, eventKey)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReprocess(event.eventName, event.year)}
                      disabled={isProcessing}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      title="Reprocess"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditForm(event)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.eventName, event.year)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Historical Data</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProcessData} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g., Sankranti"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2030"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  This will process all current Income & Expense records into historical data for VINI AI to reference.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Generate Historical Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Historical Data</h3>
              <button onClick={() => setShowEditForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="font-medium">Select Event to Edit:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {processedEvents.map((event) => (
                  <button
                    key={`${event.eventName}-${event.year}`}
                    onClick={() => setEditData({
                      oldEventName: event.eventName,
                      oldYear: event.year,
                      newEventName: event.eventName,
                      newYear: event.year
                    })}
                    className={`w-full text-left p-3 border rounded-md hover:bg-gray-50 ${
                      editData.oldEventName === event.eventName && editData.oldYear === event.year
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{event.eventName} {event.year}</div>
                    <div className="text-sm text-gray-500">{event.chunkCount} chunks</div>
                  </button>
                ))}
              </div>
            </div>

            {editData.oldEventName && (
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Event Name</label>
                  <input
                    type="text"
                    required
                    value={editData.newEventName}
                    onChange={(e) => setEditData({ ...editData, newEventName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Year</label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    value={editData.newYear}
                    onChange={(e) => setEditData({ ...editData, newYear: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    Update
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoricalDataManager;