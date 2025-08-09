import { useState, useEffect } from 'react';
import { Lock, Unlock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function LockManager() {
  const [lockSettings, setLockSettings] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLockSettings();
  }, []);

  const fetchLockSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/lock-settings`);
      setLockSettings(data);
    } catch (error) {
      console.error('Failed to fetch lock settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!lockSettings) return;
    setIsToggling(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/lock-settings/toggle`, {
        isLocked: !lockSettings.isLocked
      });
      setLockSettings(data.lockSettings);
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to toggle lock status');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Loading lock settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-start sm:items-center">
          <Shield className="h-6 w-6 mr-2 text-gray-600 flex-shrink-0" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Editing Controls</h2>
            <p className="text-sm text-gray-500">
              Control editing permissions for Income, Expense, Verification, and Recycle Bin pages
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-3 space-x-6">
          <div
            className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
              lockSettings?.isLocked
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {lockSettings?.isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlocked
              </>
            )}
          </div>

          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center justify-center px-3 py-2 rounded-md text-white font-medium shadow-sm ${
              lockSettings?.isLocked
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isToggling ? (
              'Toggling...'
            ) : lockSettings?.isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LockManager;
