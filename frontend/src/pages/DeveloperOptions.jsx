import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import PaymentDetails from '../components/developer/PaymentDetails';

function DeveloperOptions() {
  const { user } = useAuth();
  const [confirmAction, setConfirmAction] = useState('');

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  const handleClearData = async (type) => {
    if (confirmAction !== type) {
      setConfirmAction(type);
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/developer/clear/${type}`);
      toast.success(`${type} data cleared successfully`);
      setConfirmAction('');
    } catch (error) {
      toast.error(`Failed to clear ${type} data`);
    }
  };

  return (
    <div className="max-w-1xl mx-auto space-y-6">
      {/* Payment Details Section */}
      <PaymentDetails />

      {/* Clear Data Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Clear Data</h2>
        <div className="space-y-4">
          {/* Clear Users */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Clear Users Data</h3>
              <p className="text-sm text-gray-500">Delete all user accounts except the developer account</p>
            </div>
            {confirmAction === 'users' ? (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">Are you sure?</span>
                <button
                  onClick={() => handleClearData('users')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmAction('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleClearData('users')}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear Users
              </button>
            )}
          </div>

          {/* Clear Income */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Clear Income Data</h3>
              <p className="text-sm text-gray-500">Delete all income records</p>
            </div>
            {confirmAction === 'income' ? (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">Are you sure?</span>
                <button
                  onClick={() => handleClearData('income')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmAction('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleClearData('income')}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear Income
              </button>
            )}
          </div>

          {/* Clear Expense */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Clear Expense Data</h3>
              <p className="text-sm text-gray-500">Delete all expense records</p>
            </div>
            {confirmAction === 'expense' ? (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">Are you sure?</span>
                <button
                  onClick={() => handleClearData('expense')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmAction('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleClearData('expense')}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear Expense
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-yellow-800 font-medium">Warning</h3>
              <p className="text-sm text-yellow-700">
                These actions are irreversible. Please make sure you have backed up any important data
                before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperOptions;