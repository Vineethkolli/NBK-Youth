import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { getDeviceInfo } from "../utils/deviceInfo";
import { Access } from "../utils/access";
import {
  getStoredAccessToken,
  storeAccessToken,
  clearStoredAccessToken,
  resetSessionPing,
  getTokenAgeHours,
  isTokenExpired,
  shouldPingSession,
  markSessionPing,
} from "../utils/tokenManager";

axios.defaults.withCredentials = true;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAccessToken = (token) => {
    if (token) {
      storeAccessToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      clearStoredAccessToken();
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const clearAuthState = () => {
    applyAccessToken(null);
    resetSessionPing();
    setUser(null);
  };

  const attemptRefresh = async () => {
    const { data } = await axios.post(`${API_URL}/api/auth/refresh`);
    if (!data?.accessToken) return null;
    applyAccessToken(data.accessToken);
    return data.accessToken;
  };

  const pingIfNeeded = async () => {
    if (!shouldPingSession()) return;
    try {
      await axios.get(`${API_URL}/api/auth/ping`);
      markSessionPing();
    } catch (error) {
      console.warn("Ping failed:", error.message);
    }
  };

  const fetchProfile = async () => {
    const { data } = await axios.get(`${API_URL}/api/profile/profile`);
    setUser(data);

    if (data.language) {
      localStorage.setItem("preferredLanguage", data.language);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        let token = getStoredAccessToken();
        if (token && isTokenExpired(token)) {
          token = null;
        }

        if (!token) {
          token = await attemptRefresh().catch(() => null);
        } else {
          applyAccessToken(token);
          const age = getTokenAgeHours(token);

          if (age >= 48) {
            const refreshed = await attemptRefresh().catch(() => null);
            token = refreshed;
          } else if (age >= 24) {
            const refreshed = await attemptRefresh().catch(() => null);
            token = refreshed || token;
          }
        }

        if (!token) {
          clearAuthState();
          return;
        }

        applyAccessToken(token);
        await pingIfNeeded();
        await fetchProfile();
      } catch (error) {
        console.error("Auth bootstrap error:", error);
        clearAuthState();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const setTokenAndUser = (token, userObj) => {
    if (token) {
      applyAccessToken(token);
    }
    setUser(userObj);

    if (userObj?.language) {
      localStorage.setItem("preferredLanguage", userObj.language);
    }
  };

  const signin = async (identifier, password) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signin`, {
      identifier,
      password,
      language,
      deviceInfo,
    });

    const accessToken = data.accessToken || data.token;
    setTokenAndUser(accessToken, data.user);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
      ...userData,
      language,
      deviceInfo,
    });

    const accessToken = data.accessToken || data.token;
    setTokenAndUser(accessToken, data.user);
  };

  const googleAuth = async (credentialOrPayload, phoneNumber = null, name = null) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    let payload = {};
    if (typeof credentialOrPayload === "string") {
      payload = { credential: credentialOrPayload };
    } else {
      payload = credentialOrPayload;
    }

    const { data } = await axios.post(`${API_URL}/api/auth/google-auth`, {
      ...payload,
      phoneNumber,
      name,
      language,
      deviceInfo,
    });

    const accessToken = data.accessToken || data.token;
    setTokenAndUser(accessToken, data.user);
  };

  const signout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (error) {
      console.warn("Signout request failed:", error.message);
    } finally {
      clearAuthState();
    }
  };

  const hasAccess = (group) => {
    const role = user?.role;
    if (!role) return false;
    if (group === "All") return true;

    const allowed = Access[group];
    return allowed?.includes(role);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signin,
      signup,
      signout,
      googleAuth,
      hasAccess,
      updateUserData,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
