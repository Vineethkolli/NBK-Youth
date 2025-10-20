import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';

const MaintenanceModeContext = createContext();

export const MaintenanceModeProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [expectedBackAt, setExpectedBackAt] = useState('');

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/maintenance/status`);
        setIsMaintenanceMode(data.isEnabled);
        if (data.expectedBackAt) {
          setExpectedBackAt(new Date(data.expectedBackAt).toISOString().slice(0, 16));
        }
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  const toggleMaintenanceMode = async (isEnabled, expectedBackAt = null) => {
    try {
      await axios.post(`${API_URL}/api/maintenance/toggle`, {
        isEnabled,
        expectedBackAt,
      });
      setIsMaintenanceMode(isEnabled);
      setExpectedBackAt(expectedBackAt);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  return (
    <MaintenanceModeContext.Provider
      value={{
        isMaintenanceMode,
        expectedBackAt,
        toggleMaintenanceMode,
      }}
    >
      {children}
    </MaintenanceModeContext.Provider>
  );
};

export const useMaintenanceMode = () => useContext(MaintenanceModeContext);
