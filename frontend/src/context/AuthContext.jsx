import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { getDeviceInfo } from '../utils/deviceInfo';
import { Access } from '../utils/access';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/profile/profile`);
      setUser((prev) => ({ ...(prev || {}), ...data }));

      if (data.language) {
        localStorage.setItem('preferredLanguage', data.language);
      }
    } catch (error) {
      console.error('Profile fetch failed:', error?.response?.data || error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const signin = async (identifier, password) => {
    const language = localStorage.getItem('preferredLanguage') || 'en';
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signin`, {
      identifier,
      password,
      language,
      deviceInfo,
    });

    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    if (data.user.language) {
      localStorage.setItem('preferredLanguage', data.user.language);
    }
    setUser(data.user);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem('preferredLanguage') || 'en';
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
      ...userData,
      language,
      deviceInfo,
    });

    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    if (data.user.language) {
      localStorage.setItem('preferredLanguage', data.user.language);
    }
    setUser(data.user);
  };

  const signout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Unified role checker
  const hasAccess = useCallback(
    (group) => {
      const role = user?.role;
      if (!role) return false;
      if (group === 'All') return true;

      const allowed = Access[group];
      return Array.isArray(allowed) && allowed.includes(role);
    },
    [user?.role]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      signin,
      signup,
      signout,
      updateUserData,
      hasAccess,
    }),
    [user, loading, signin, signup, signout, updateUserData, hasAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
