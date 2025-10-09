import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function ClearData() {
  const [confirmAction, setConfirmAction] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const openConfirmDialog = async (type) => {
    setConfirmAction(type);

    const firstConfirm = window.confirm(
      `Are you sure you want to clear ${type} data?`
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      'Are you sure? This action is irreversible.'
    );
    if (!secondConfirm) return;

    handleConfirmClearData();
  };

  // Handle actual data clearing
  const handleConfirmClearData = async () => {
    setIsClearing(true);
    try {
      await axios.delete(`${API_URL}/api/developer/clear/${confirmAction}`);
      toast.success(`${confirmAction} data cleared successfully`);
    } catch (error) {
      toast.error(`Failed to clear ${confirmAction} data`);
    } finally {
      setIsClearing(false);
      setConfirmAction('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-2xl font-semibold mb-4">Clear Data</h2>
      <div className="space-y-4">
        {[
          { name: 'Incomes', type: 'income' },
          { name: 'Expenses', type: 'expense' },
          { name: 'Estimated Incomes', type: 'estimatedIncome' },
          { name: 'Estimated Expenses', type: 'estimatedExpense' },
          { name: 'Notifications', type: 'notifications' },
          { name: 'Events', type: 'events' },
          { name: "Activities", type: 'letsPlay' },
          { name: 'User Payments', type: 'payment' },
          { name: 'Activity Logs', type: 'activityLog' },
        ].map(({ name, type }) => (
          <div key={type} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{name} Data</h3>
            </div>
            <button
              onClick={() => openConfirmDialog(type)}
              className={`flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md ${
                isClearing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isClearing}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete All {name}
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
    </div>
  );
}

export default ClearData;
