import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
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
      const { data } = await axios.get(`${API_URL}/api/hidden-profiles`);
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
      const { data } = await axios.post(
        `${API_URL}/api/hidden-profiles/toggle`,
        { profileId }
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
