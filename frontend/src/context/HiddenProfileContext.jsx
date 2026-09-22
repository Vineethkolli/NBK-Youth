import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

const HiddenProfileContext = createContext();

export const useHiddenProfiles = () => useContext(HiddenProfileContext);

const getProfileKey = (profileId, profileType) => `${profileType}:${profileId}`;

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
      setHiddenProfiles(new Set(data.map(profile => (
        typeof profile === 'string'
          ? getProfileKey(profile, 'Income')
          : getProfileKey(profile.profileId, profile.profileType || 'Income')
      ))));
    } catch (error) {
      console.error('Failed to fetch hidden profiles:', error);
      // Clear hidden profiles if unauthorized
      if (error.response?.status === 401) {
        setHiddenProfiles(new Set());
      }
    }
  };

  const toggleProfileHidden = async (profileId, profileType = 'Income') => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/hidden-profiles/toggle`,
        { profileId, profileType }
      );
      
      setHiddenProfiles(prev => {
        const newSet = new Set(prev);
        const profileKey = getProfileKey(profileId, profileType);
        if (data.hidden) {
          newSet.add(profileKey);
        } else {
          newSet.delete(profileKey);
        }
        return newSet;
      });
      
      return data.hidden;
    } catch (error) {
      console.error('Failed to toggle profile hidden status:', error);
      return null;
    }
  };

  const isProfileHidden = (profileId, profileType) => (
    hiddenProfiles.has(getProfileKey(profileId, profileType))
  );

  return (
    <HiddenProfileContext.Provider value={{ hiddenProfiles, isProfileHidden, toggleProfileHidden }}>
      {children}
    </HiddenProfileContext.Provider>
  );
};
