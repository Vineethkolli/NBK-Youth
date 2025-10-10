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

  const openConfirmDialog = (type) => {
    setConfirmAction(type);
    setConfirmStep(1);
    setIsConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    setIsClearing(true);
    try {
      await axios.delete(`${API_URL}/api/developer/clear/${confirmAction}`);
      toast.success(`${confirmAction} data cleared successfully`);
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
          { name: 'Notifications', type: 'notifications' },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="text-lg font-medium mb-4">
              {confirmStep === 1
                ? `Are you sure you want to clear ${confirmAction} data?`
                : 'Are you sure? This action is irreversible.'}
            </h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center ${
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
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
