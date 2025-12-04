import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function ClearData() {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
  const [confirmAction, setConfirmAction] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Options from ActivityLog entityTypes
  const activityEntities = [
    'User', 'Income', 'Expense', 'Payment', 'Vibe', 'Moment', 'Game', 'Banner', 'EstimatedIncome', 
    'EstimatedExpense', 'HiddenProfile', 'Slide', 'Event', 'Notification', 'PreviousYear', 'MaintenanceMode', 
    'DeveloperOptions', 'Committee', 'PaymentDetails', 'EventLabel', 'LockSettings', 'FinancialRecord', 
    'EventRecord', 'Snapshot', 'History', 'ScheduledNotification', 'Email', 'Mobile'
  ];

  const openConfirmDialog = (type) => {
    setConfirmAction(type);
    setConfirmStep(1);
    setSelectedEntities([]);
    setFromDate('');
    setToDate('');
    setIsConfirmVisible(true);
  };

  const toggleEntity = (entityName) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityName)) {
        return prev.filter(e => e !== entityName);
      } else {
        return [...prev, entityName];
      }
    });
  };

  const selectAllEntities = () => {
    if (selectedEntities.length === activityEntities.length) {
      setSelectedEntities([]);
    } else {
      setSelectedEntities([...activityEntities]);
    }
  };

  const handleConfirm = async () => {
    if (confirmStep === 1) {
      if (confirmAction === 'activityLog' && selectedEntities.length === 0) {
        toast.error('Please select at least one entity type to delete');
        return;
      }
      setConfirmStep(2);
      return;
    }

    setIsClearing(true);
    try {
      if (confirmAction === 'activityLog') {
        // Build payload - entities
        const payload = { entities: selectedEntities };
        if (fromDate) payload.fromDate = new Date(fromDate).toISOString();
        if (toDate) payload.toDate = new Date(toDate).toISOString();
        await axios.delete(`${API_URL}/api/developer/clear/${confirmAction}`, { data: payload });
        toast.success(`Activity logs cleared successfully`);
      } else {
        await axios.delete(`${API_URL}/api/developer/clear/${confirmAction}`);
        toast.success(`${confirmAction} data cleared successfully`);
      }
    } catch (error) {
      toast.error(`Failed to clear ${confirmAction} data`);
    }
    closeDialog();
    setIsClearing(false);
  };

  const closeDialog = () => {
    setIsConfirmVisible(false);
    setConfirmAction('');
    setConfirmStep(1);
    setIsClearing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Clear Data</h2>
      <div className="space-y-4">
        {[
          { name: 'Incomes', type: 'income' },
          { name: 'Expenses', type: 'expense' },
          { name: 'Estimated Incomes', type: 'estimatedIncome' },
          { name: 'Estimated Expenses', type: 'estimatedExpense' },
          { name: 'Event Labels', type: 'eventLabels' },
          { name: 'Previous Year Amount', type: 'previousYear' },
          { name: 'Event Timeline', type: 'events' },
          { name: 'Activities', type: 'activities' },
          { name: 'User Payments', type: 'payment' },
          { name: 'Notification History', type: 'notifications' },
          { name: 'Activity Logs', type: 'activityLog' },
        ].map(({ name, type }) => (
          <div key={type} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{name}</h3>
            </div>
            <button
              onClick={() => openConfirmDialog(type)}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 p-4 rounded-md">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
          <div>
            <h3 className="text-yellow-800 font-medium">Warning</h3>
            <p className="text-sm text-yellow-700">
              These actions are irreversible. Please make sure you have backed up any important data before proceeding.
            </p>
          </div>
        </div>
      </div>

      {isConfirmVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-medium mb-4">
              {confirmStep === 1
                ? (confirmAction === 'activityLog' ? 'Clear Activity Logs' : `Are you sure you want to clear ${confirmAction} data?`)
                : 'Are you sure? This action is irreversible.'}
            </h3>

{confirmStep === 1 && confirmAction === 'activityLog' && (
  <div className="space-y-4 mb-4">
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Entity Types {selectedEntities.length > 0 && (
            <span className="text-indigo-600">({selectedEntities.length} selected)</span>
          )}
        </label>
        <button
          type="button"
          onClick={selectAllEntities}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {selectedEntities.length === activityEntities.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="border border-gray-300 rounded-lg max-h-48 sm:max-h-45 overflow-y-auto p-2">
        {activityEntities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No entities available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activityEntities.map((entityName) => (
              <label
                key={entityName}
                className="flex items-center space-x-2 p-0.5 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEntities.includes(entityName)}
                  onChange={() => toggleEntity(entityName)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{entityName}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          From Date & Time
        </label>
        <input
          type="datetime-local"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          To Date & Time
        </label>
        <input
          type="datetime-local"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <p className="text-xs text-gray-500 rounded-lg">
      <span className="font-medium text-gray-700">Note: </span>
      If only <span className="font-medium">From Date</span> is set, records are deleted from that date to now.
      If only <span className="font-medium">To Date</span> is set, records are deleted up to that date.
    </p>
  </div>
)}

<div className="flex justify-end space-x-4 pt-1 mt-4">
  <button
    onClick={closeDialog}
    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    disabled={isClearing}
  >
    Cancel
  </button>
  <button
    onClick={handleConfirm}
    className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-all ${
      isClearing ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    disabled={isClearing}
  >
    {isClearing && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
    {isClearing
      ? 'Clearing...'
      : confirmStep === 1
      ? 'Yes, Continue'
      : 'Confirm'}
  </button>
</div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ClearData;
