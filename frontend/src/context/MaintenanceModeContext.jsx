import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

const MaintenanceModeContext = createContext();

export const MaintenanceModeProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [expectedBackAt, setExpectedBackAt] = useState('');
  const [maintenanceAccess, setMaintenanceAccess] = useState('everyone');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/maintenance/status`);
        setIsMaintenanceMode(data.isEnabled);
        setMaintenanceAccess(data.maintenanceAccess || 'everyone');
        if (data.expectedBackAt) {
          setExpectedBackAt(new Date(data.expectedBackAt).toISOString().slice(0, 16));
        }
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  const toggleMaintenanceMode = async (
    isEnabled,
    expectedBackAt = null,
    access = maintenanceAccess
  ) => {
    try {
      await axios.post(`${API_URL}/api/maintenance/toggle`, {
        isEnabled,
        expectedBackAt,
        maintenanceAccess: access,
      });
      setIsMaintenanceMode(isEnabled);
      setExpectedBackAt(expectedBackAt);
      setMaintenanceAccess(access);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      throw error;
    }
  };

  const canSeeMaintenancePage = isMaintenanceMode && (
    user?.role !== 'developer' &&
    (maintenanceAccess === 'everyone' ||
      (maintenanceAccess === 'exceptFinanciers' && user?.role !== 'financier') ||
      (maintenanceAccess === 'exceptAdminsFinanciers' &&
        !['admin', 'financier'].includes(user?.role)))
  );

  return (
    <MaintenanceModeContext.Provider
      value={{
        isMaintenanceMode,
        expectedBackAt,
        maintenanceAccess,
        toggleMaintenanceMode,
        canSeeMaintenancePage,
      }}
    >
      {children}
    </MaintenanceModeContext.Provider>
  );
};

export const useMaintenanceMode = () => useContext(MaintenanceModeContext);
