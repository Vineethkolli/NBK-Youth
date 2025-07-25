import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/developer/PaymentDetails';
import MaintenanceMode from '../components/developer/MaintenanceMode';
import RoleStatistics from '../components/developer/Stats';
import BannerManager from '../components/developer/BannerManager';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';

function AdminPanel() {
    const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

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
  
    if (user?.role == 'user') {
      return <div>Access denied</div>;
    }
  
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner Manager */}
        <BannerManager />
        
        {/* Maintenance Mode Section */}
        <MaintenanceMode />
        
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
            isResetting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isResetting ? 'Resetting...' : 'Reset Roles'}
        </button>
      </div>

        {/* Role Statistics */}
        <RoleStatistics />
  
        {/* Payment Details */}
        <PaymentDetails />

      </div>
    );
  }
  
  export default AdminPanel;
  