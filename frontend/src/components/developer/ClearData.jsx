import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function ClearData() {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');

  const openConfirmDialog = (type) => {
    setConfirmAction(type);
    setIsConfirmVisible(true);
  };

  // Handle final confirmation to clear data
  const handleConfirmClearData = async () => {
    try {
      await axios.delete(`${API_URL}/api/developer/clear/${confirmAction}`);
      toast.success(`${confirmAction} data cleared successfully`);
    } catch (error) {
      toast.error(`Failed to clear ${confirmAction} data`);
    }
    closeDialog();
  };

  const closeDialog = () => {
    setIsConfirmVisible(false);
    setConfirmAction('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-2xl font-semibold mb-4">Clear Data</h2>
      <div className="space-y-4">
        {[
          { name: 'Income', type: 'income' },
          { name: 'Expense', type: 'expense' },
          { name: 'Estimated Income', type: 'estimatedIncome' },
          { name: 'Estimated Expense', type: 'estimatedExpense' },
          { name: 'Notification', type: 'notifications' },
          { name: 'Events', type: 'events' },
          { name: "Let's Play", type: 'letsPlay' },
          { name: 'Activity Log', type: 'activityLog'},
        ].map(({ name, type, description }) => (
          <div key={type} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{name} Data</h3>
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={() => openConfirmDialog(type)}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete {name}
            </button>
          </div>
        ))}
      </div>

      {/* Warning Section */}
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

      {/* Confirmation Modal */}
      {isConfirmVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="text-lg font-medium mb-4">
              Are you sure you want to clear {confirmAction} data?
            </h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleConfirmClearData}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
