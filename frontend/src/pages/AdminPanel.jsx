import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PaymentDetails from '../components/developer/PaymentDetails';
import MaintenanceMode from '../components/developer/MaintenanceMode';
import RoleStatistics from '../components/developer/Stats';
import BannerManager from '../components/developer/BannerManager';
import EventLabelManager from '../components/developer/EventLabelManager';
import LockManager from '../components/developer/LockManager';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { useEffect } from 'react';

function AdminPanel() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add loading delay to ensure Google Translate doesn't interfere
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, language === 'te' ? 1000 : 100); // Longer delay for Telugu

    return () => clearTimeout(timer);
  }, [language]);

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

  if (user?.role === 'user') {
    return <div>Access denied</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" key={language}>

      {/* Banner Manager (Developer Only) */}
       <BannerManager />

      {/* Maintenance Mode (Developer Only) */}
     <MaintenanceMode />

      {/* Reset Roles (Developer Only) */}
      {user?.role === 'developer' && (
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
      )}

      {/* Lock Manager (Developer Only) */}
      {user?.role === 'developer' && <LockManager />}

      {/* Event Label Manager (Developer Only) */}
      <EventLabelManager />

      {/* Role Statistics (Visible to all non-user roles) */}
      <RoleStatistics />

      {/* Payment Details (Visible to all non-user roles) */}
      <PaymentDetails />
    </div>
  );
}

export default AdminPanel;
