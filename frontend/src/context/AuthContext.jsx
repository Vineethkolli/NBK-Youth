import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { getDeviceInfo } from "../utils/deviceInfo";
import { Access } from "../utils/access";

axios.defaults.withCredentials = true;

const ACCESS_TOKEN_KEY = "accessToken";
const LAST_ACTIVE_PING_KEY = "lastActivePing";
const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const LAST_ACTIVE_INTERVAL_MS = 1000 * 60 * 60 * 24;

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload;
  } catch {
    return null;
  }
};

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAccessToken = useCallback((token) => {
    if (!token) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, []);

  const clearAccessToken = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVE_PING_KEY);
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  const clearSessionState = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, [clearAccessToken]);

  const setTokenAndUser = useCallback(
    (token, userObj) => {
      if (token) setAccessToken(token);
      if (userObj) {
        setUser(userObj);
        if (userObj.language) {
          localStorage.setItem("preferredLanguage", userObj.language);
        }
      }
    },
    [setAccessToken]
  );

  const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const fetchProfile = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/api/profile/profile`);
    setUser(data);
    if (data.language) {
      localStorage.setItem("preferredLanguage", data.language);
    }
    return data;
  }, []);

  const maybePingLastActive = useCallback(async (force = false) => {
    try {
      const lastPing = Number(localStorage.getItem(LAST_ACTIVE_PING_KEY) || "0");
      if (!force && Date.now() - lastPing < LAST_ACTIVE_INTERVAL_MS) return;

      await axios.get(`${API_URL}/api/auth/last-active`);
      localStorage.setItem(LAST_ACTIVE_PING_KEY, Date.now().toString());
    } catch {
      // Ignore background ping errors
    }
  }, []);

  const refreshAccessToken = useCallback(
    async ({ withProfile } = {}) => {
      const { data } = await axios.post(`${API_URL}/api/auth/refresh`);
      const newToken = data.accessToken || data.token;
      if (!newToken) throw new Error("Missing access token");

      if (data.user) {
        setTokenAndUser(newToken, data.user);
      } else {
        setAccessToken(newToken);
      }

      await maybePingLastActive(true);

      if (withProfile && !data.user) {
        await fetchProfile();
      }

      return newToken;
    },
    [fetchProfile, maybePingLastActive, setAccessToken, setTokenAndUser]
  );

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!storedToken) {
        if (mounted) setLoading(false);
        return;
      }

      const payload = decodeToken(storedToken);
      if (!payload?.iat) {
        clearSessionState();
        if (mounted) setLoading(false);
        return;
      }

      const tokenAge = Date.now() - payload.iat * 1000;

      try {
        if (tokenAge >= ACCESS_TOKEN_MAX_AGE_MS) {
          await refreshAccessToken({ withProfile: true });
        } else {
          setAccessToken(storedToken);
          await fetchProfile();
          await maybePingLastActive(false);
        }
      } catch (error) {
        console.error("Auth bootstrap failed", error);
        clearSessionState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [clearSessionState, fetchProfile, maybePingLastActive, refreshAccessToken, setAccessToken]);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !(originalRequest.url || "").includes("/api/auth/refresh")
        ) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
          } catch {
            clearSessionState();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [clearSessionState, refreshAccessToken]);

  const signin = async (identifier, password) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signin`, {
      identifier,
      password,
      language,
      deviceInfo,
    });

    const token = data.accessToken || data.token;
    setTokenAndUser(token, data.user);
    await maybePingLastActive(true);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
      ...userData,
      language,
      deviceInfo,
    });

    const token = data.accessToken || data.token;
    setTokenAndUser(token, data.user);
    await maybePingLastActive(true);
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

    const token = data.accessToken || data.token;
    setTokenAndUser(token, data.user);
    await maybePingLastActive(true);
  };

  const signout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/signout`);
    } catch {
      // ignore
    }
    clearSessionState();
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
