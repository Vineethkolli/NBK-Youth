import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const HiddenProfileContext = createContext();

export const useHiddenProfiles = () => useContext(HiddenProfileContext);

export const HiddenProfileProvider = ({ children }) => {
  const [hiddenProfiles, setHiddenProfiles] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHiddenProfiles();
    }
  }, [user]);

  const fetchHiddenProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await api.get(`/api/hidden-profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setHiddenProfiles(new Set(data));
    } catch (error) {
      console.error('Failed to fetch hidden profiles:', error);
      // Clear hidden profiles if unauthorized
      if (error.response?.status === 401) {
        setHiddenProfiles(new Set());
      }
    }
  };

  const toggleProfileHidden = async (profileId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const { data } = await api.post(`/api/hidden-profiles/toggle`,
        { profileId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setHiddenProfiles(prev => {
        const newSet = new Set(prev);
        if (data.hidden) {
          newSet.add(profileId);
        } else {
          newSet.delete(profileId);
        }
        return newSet;
      });
      
      return data.hidden;
    } catch (error) {
      console.error('Failed to toggle profile hidden status:', error);
      return null;
    }
  };

  return (
    <HiddenProfileContext.Provider value={{ hiddenProfiles, toggleProfileHidden }}>
      {children}
    </HiddenProfileContext.Provider>
  );
};
