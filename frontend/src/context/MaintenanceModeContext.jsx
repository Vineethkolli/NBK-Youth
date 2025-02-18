import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';

const MaintenanceModeContext = createContext();

// Helper to format a date as "YYYY-MM-DDTHH:mm" in local time
const toLocalDatetimeString = (dateInput) => {
  const date = new Date(dateInput);
  const pad = (num) => (num < 10 ? '0' + num : num);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const MaintenanceModeProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [expectedBackAt, setExpectedBackAt] = useState('');

  useEffect(() => {
    // Fetch the current maintenance status from the server
    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/maintenance/status`);
        setIsMaintenanceMode(data.isEnabled);
        if (data.expectedBackAt) {
          // Convert the date from the server into a local datetime string
          setExpectedBackAt(toLocalDatetimeString(data.expectedBackAt));
        }
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  const toggleMaintenanceMode = async (isEnabled, expectedBackAtValue = null) => {
    try {
      await axios.post(`${API_URL}/api/maintenance/toggle`, {
        isEnabled,
        expectedBackAt: expectedBackAtValue,
      });
      setIsMaintenanceMode(isEnabled);
      // Save the value exactly as provided by the input so it remains in local time
      setExpectedBackAt(expectedBackAtValue);
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
