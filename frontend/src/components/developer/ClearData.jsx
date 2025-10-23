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
  const [entity, setEntity] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Options from ActivityLog entityTypes
  const activityEntities = [
    'All', 'User', 'Income', 'Expense', 'Payment', 'Vibe', 'Moment', 'Game', 'Banner', 'EstimatedIncome', 'EstimatedExpense',
    'HiddenProfile', 'Slide', 'Event', 'Notification', 'PreviousYear', 'MaintenanceMode', 'DeveloperOptions', 'Committee',
    'PaymentDetails', 'EventLabel', 'LockSettings', 'FinancialRecord', 'EventRecord', 'Snapshot', 'History', 'ScheduledNotification'
  ];

  const openConfirmDialog = (type) => {
    setConfirmAction(type);
    setConfirmStep(1);
    setEntity('All');
    setFromDate('');
    setToDate('');
    setIsConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    setIsClearing(true);
    try {
      if (confirmAction === 'activityLog') {
        // Build payload only including provided fields
        const payload = {};
        if (entity && entity !== 'All') payload.entity = entity;
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
          { name: 'Notification History', type: 'notifications' },
          { name: 'Events', type: 'events' },
          { name: 'Activities', type: 'letsPlay' },
          { name: 'User Payments', type: 'payment' },
          { name: 'Activity Logs', type: 'activityLog' },
        ].map(({ name, type }) => (
          <div key={type} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{name} Data</h3>
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

      {/* Two-step Confirmation Modal */}
      {isConfirmVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-90">
            <h3 className="text-lg font-medium mb-4">
              {confirmStep === 1
                ? (confirmAction === 'activityLog' ? 'Clear Activity Logs' : `Are you sure you want to clear ${confirmAction} data?`)
                : 'Are you sure? This action is irreversible.'}
            </h3>

            {/* Activity Log filter inputs */}
{confirmStep === 1 && confirmAction === 'activityLog' && (
  <div className="space-y-4 mb-4">
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">Entity</label>
      <select
        value={entity}
        onChange={(e) => setEntity(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {activityEntities.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>

    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        From Date & Time <span className="text-gray-400"></span>
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
        To Date & Time <span className="text-gray-400"></span>
      </label>
      <input
        type="datetime-local"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <p className="text-xs text-gray-500 pt-2">
      Leave fields blank to delete <span className="font-medium text-gray-700">all records</span>.
      If only <span className="font-medium">From Date</span> is set, records are deleted from that date to now.
      If only <span className="font-medium">To Date</span> is set, records are deleted up to that date.
    </p>
  </div>
)}

{/* Buttons */}
<div className="flex justify-end space-x-3 pt-2 mt-4">
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
      : (confirmAction === 'activityLog' ? 'Confirm' : 'Confirm')}
  </button>

  <button
    onClick={closeDialog}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
    disabled={isClearing}
  >
    Cancel
  </button>
</div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ClearData;
