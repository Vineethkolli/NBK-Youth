import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const LockContext = createContext();

export const useLockSettings = () => useContext(LockContext);

export const LockProvider = ({ children }) => {
  const [lockSettings, setLockSettings] = useState({ isLocked: false });

  useEffect(() => {
    fetchLockSettings();
  }, []);

  const fetchLockSettings = async () => {
    try {
      const { data } = await api.get(`/api/lock-settings`);
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
