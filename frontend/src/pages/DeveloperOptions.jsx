import { useAuth } from '../context/AuthContext';
import ClearData from '../components/developer/ClearData';
import ProcessedDataManager from '../components/developer/ProcessedDataManager';
import SnapshotManager from '../components/developer/SnapshotManager';
import LockManager from '../components/developer/LockManager';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';

function DeveloperOptions() {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  if (user?.role !== 'developer') {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg font-semibold">
        Access Denied
      </div>
    );
  }

  const handleResetRoles = async () => {
    if (!window.confirm('Are you sure you want to reset all non-developer roles to "user"?')) {
      return;
    }
    setIsResetting(true);
    try {
      await axios.delete(`${API_URL}/api/developer/clear/resetRoles`);
      toast.success('All non-developer users have been reset to "user"');
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset roles');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-xl shadow-md p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-blue-800 mb-1">Backend Health Monitor</h2>
        </div>
        <a
          href="https://r4styp9l.status.cron-job.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
        >
          Status
        </a>
      </div>

      <LockManager />

      {/* Reset Roles */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reset Roles</h2>
          <p className="text-sm text-gray-500">
            This will set every user except developers back to the <code>user</code> role.
          </p>
        </div>
        <button
          onClick={handleResetRoles}
          disabled={isResetting}
          className={`flex items-center px-4 py-2 rounded-md text-white ${
            isResetting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isResetting ? 'Resetting...' : 'Reset'}
        </button>
      </div>

      <ClearData />

      <SnapshotManager />
      
      <ProcessedDataManager />
    </div>
  );
}

export default DeveloperOptions;
