import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import FinancialTimeline from '../components/records/FinancialTimeline';
import EventRecordsGrid from '../components/records/EventRecordsGrid';
import FinancialRecordForm from '../components/records/FinancialRecordForm';
import EventRecordForm from '../components/records/EventRecordForm';

function Records() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [financialRecords, setFinancialRecords] = useState([]);
  const [eventRecords, setEventRecords] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventNames, setEventNames] = useState([]);
  const [recordEventNames, setRecordEventNames] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingFinancialRecord, setEditingFinancialRecord] = useState(null);
  const [editingEventRecord, setEditingEventRecord] = useState(null);

  const isDeveloper = user?.role === 'developer';

  useEffect(() => {
    fetchFinancialRecords();
    fetchEventRecords();
    fetchEventNames();
    fetchRecordEventNames();
  }, []);

  useEffect(() => {
    if (eventNames.length > 0 && !selectedEvent) {
      setSelectedEvent(eventNames[0]);
    }
  }, [eventNames]);

  const fetchFinancialRecords = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/records/financial`);
      setFinancialRecords(data);
    } catch (error) {
      toast.error('Failed to fetch financial records');
    }
  };

  const fetchEventRecords = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/records/event-records`);
      setEventRecords(data);
    } catch (error) {
      toast.error('Failed to fetch event records');
    }
  };

  const fetchEventNames = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/records/financial/event-names`);
      setEventNames(data);
    } catch (error) {
      console.error('Failed to fetch event names');
    }
  };

  const fetchRecordEventNames = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/records/event-records/event-names`);
      setRecordEventNames(data);
    } catch (error) {
      console.error('Failed to fetch record event names');
    }
  };

  const handleFinancialRecordSubmit = async (formData) => {
    try {
      if (editingFinancialRecord) {
        await axios.put(`${API_URL}/api/records/financial/${editingFinancialRecord._id}`, formData);
        toast.success('Financial record updated successfully');
      } else {
        await axios.post(`${API_URL}/api/records/financial`, formData);
        toast.success('Financial record created successfully');
      }
      fetchFinancialRecords();
      fetchEventNames();
      setShowFinancialForm(false);
      setEditingFinancialRecord(null);
    } catch (error) {
      // If duplicate (backend returns 400 with duplicate message), show single toast
      const msg = error?.response?.data?.message;
      if (error?.response?.status === 400 && msg) {
        toast.error(msg);
        return;
      }
      toast.error('Failed to save financial record');
      console.error(error);
    }
  };

  const handleEventRecordSubmit = async (formData) => {
    try {
      if (editingEventRecord) {
        await axios.put(`${API_URL}/api/records/event-records/${editingEventRecord._id}`, formData);
        toast.success('Event record updated successfully');
      } else {
        await axios.post(`${API_URL}/api/records/event-records`, formData);
        toast.success('Event record uploaded successfully');
      }
      fetchEventRecords();
      fetchRecordEventNames();
      setShowRecordForm(false);
      setEditingEventRecord(null);
    } catch (error) {
      const msg = error?.response?.data?.message;
      if (error?.response?.status === 400 && msg) {
        toast.error(msg);
        return;
      }
      toast.error('Failed to save event record');
      console.error(error);
    }
  };

  const handleFinancialRecordEdit = (record) => {
    setEditingFinancialRecord(record);
    setShowFinancialForm(true);
  };

  const handleFinancialRecordDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial record?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/records/financial/${id}`);
      toast.success('Financial record deleted successfully');
      fetchFinancialRecords();
      fetchEventNames();
    } catch (error) {
      toast.error('Failed to delete financial record');
    }
  };

  const handleEventRecordEdit = (record) => {
    setEditingEventRecord(record);
    setShowRecordForm(true);
  };

  const handleEventRecordDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event record?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/records/event-records/${id}`);
      toast.success('Event record deleted successfully');
      fetchEventRecords();
      fetchRecordEventNames();
    } catch (error) {
      toast.error('Failed to delete event record');
    }
  };

  const filteredFinancialRecords = selectedEvent 
    ? financialRecords.filter(record => record.eventName === selectedEvent)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <h1 className="text-2xl font-semibold">Records</h1>

        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-md font-semibold flex items-center ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Financial Timeline
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-md font-semibold flex items-center ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Records
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Event:</span>
              <div className="flex flex-wrap gap-2">
                {eventNames.map(eventName => (
                  <button
                    key={eventName}
                    onClick={() => setSelectedEvent(eventName)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      selectedEvent === eventName
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {eventName}
                  </button>
                ))}
              </div>
            </div>

            {isDeveloper && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFinancialForm(true)}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`btn-primary flex items-center ${isEditMode ? 'bg-red-100' : ''}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Done' : 'Edit'}
                </button>
              </div>
            )}
          </div>

          {/* Financial Timeline */}
          <FinancialTimeline
            records={filteredFinancialRecords}
            isEditMode={isEditMode}
            onEdit={handleFinancialRecordEdit}
            onDelete={handleFinancialRecordDelete}
          />
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-6">
          {isDeveloper && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRecordForm(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`btn-primary flex items-center ${isEditMode ? 'bg-red-100' : ''}`}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            </div>
          )}

          {/* Event Records Grid */}
          <EventRecordsGrid
            records={eventRecords}
            isEditMode={isEditMode}
            onEdit={handleEventRecordEdit}
            onDelete={handleEventRecordDelete}
          />
        </div>
      )}

      {/* Forms */}
      {showFinancialForm && (
        <FinancialRecordForm
          record={editingFinancialRecord}
          onClose={() => {
            setShowFinancialForm(false);
            setEditingFinancialRecord(null);
          }}
          onSubmit={handleFinancialRecordSubmit}
        />
      )}

      {showRecordForm && (
        <EventRecordForm
          record={editingEventRecord}
          onClose={() => {
            setShowRecordForm(false);
            setEditingEventRecord(null);
          }}
          onSubmit={handleEventRecordSubmit}
        />
      )}

    <footer className="pt-8 border-t text-center text-sm text-gray-500">
      Since 2023 — We moved all records from paper to digital
    </footer>
    </div>
  );
}

export default Records;
