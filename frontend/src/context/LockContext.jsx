import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';

const LockContext = createContext();

export const useLockSettings = () => useContext(LockContext);

export const LockProvider = ({ children }) => {
  const [lockSettings, setLockSettings] = useState({ isLocked: false });

  useEffect(() => {
    fetchLockSettings();
  }, []);

  const fetchLockSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/lock-settings`);
      setLockSettings(data);
    } catch (error) {
      console.error('Failed to fetch lock settings:', error);
    }
  };

  const refreshLockSettings = () => {
    fetchLockSettings();
  };

  return (
    <LockContext.Provider value={{ lockSettings, refreshLockSettings }}>
      {children}
    </LockContext.Provider>
  );
};
