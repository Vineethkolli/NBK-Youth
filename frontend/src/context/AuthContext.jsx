import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { getDeviceInfo } from "../utils/deviceInfo";
import { Access } from "../utils/access";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getTokenAgeDays = (issuedAt) => {
  const now = Math.floor(Date.now() / 1000);
  const ageSeconds = now - issuedAt;
  return ageSeconds / (60 * 60 * 24);
};

const wasLastActiveUpdatedToday = () => {
  const lastUpdate = localStorage.getItem("lastActiveUpdate");
  if (!lastUpdate) return false;

  const today = new Date().toDateString();
  const last = new Date(parseInt(lastUpdate)).toDateString();
  return today === last;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef(null);

  // Axios interceptor handles token expired during usage
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          error.response?.data?.expired &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            if (!refreshPromiseRef.current) {
              refreshPromiseRef.current = axios.post(
                `${API_URL}/api/sessions/refresh`,
                {},
                { withCredentials: true }
              ).finally(() => {
                refreshPromiseRef.current = null;
              });
            }

            const { data } = await refreshPromiseRef.current;

            localStorage.setItem("token", data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            originalRequest.headers["Authorization"] = `Bearer ${data.token}`;

            setUser(data.user);
            if (data.user.language)
              localStorage.setItem("preferredLanguage", data.user.language);

            return axios(originalRequest);
          } catch (err) {
            localStorage.removeItem("token");
            localStorage.removeItem("lastActiveUpdate");
            delete axios.defaults.headers.common["Authorization"];
            setUser(null);
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);


  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const decoded = decodeToken(token);
      if (!decoded || !decoded.iat) {
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      const tokenAge = getTokenAgeDays(decoded.iat);

      // proactive refresh when token is ≥ 14 days old
      if (tokenAge >= 14) {
        try {
          // Check if offline - don't attempt refresh if no connection
          if (!navigator.onLine) {
            console.warn("Offline detected - skipping proactive token refresh");
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const cached = sessionStorage.getItem("cachedUser");
            if (cached) {
              setUser(JSON.parse(cached));
            }
            setLoading(false);
            return;
          }

          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = axios.post(
              `${API_URL}/api/sessions/refresh`,
              {},
              { withCredentials: true }
            ).finally(() => {
              refreshPromiseRef.current = null;
            });
          }

          const { data } = await refreshPromiseRef.current;

          localStorage.setItem("token", data.token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

          setUser(data.user);
          sessionStorage.setItem("cachedUser", JSON.stringify(data.user));
          if (data.user.language)
            localStorage.setItem("preferredLanguage", data.user.language);

          updateLastActiveIfNeeded();
        } catch (error) {
          console.error("Proactive refresh failed:", error);
          
          // Only sign out on auth errors, not network errors
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("lastActiveUpdate");
            delete axios.defaults.headers.common["Authorization"];
          } else if (!error.response) {
            // Network error - keep session, use cached user if available
            console.warn("Network error during token refresh - keeping session");
            const cached = sessionStorage.getItem("cachedUser");
            if (cached) {
              setUser(JSON.parse(cached));
            }
          }
        }

        setLoading(false);
        return;
      }

      // Check if offline before fetching profile
      if (!navigator.onLine) {
        console.warn("Offline detected - using cached user data");
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const cached = sessionStorage.getItem("cachedUser");
        if (cached) {
          setUser(JSON.parse(cached));
        }
        setLoading(false);
        
        // Listen for connection and fetch profile when back online
        const handleOnline = async () => {
          console.log("Connection restored - fetching fresh profile");
          await fetchProfile();
          window.removeEventListener('online', handleOnline);
        };
        window.addEventListener('online', handleOnline);
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      await fetchProfile();
      updateLastActiveIfNeeded();
    };

    initAuth();
  }, []);
  

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/profile/profile`);
      setUser(data);
      sessionStorage.setItem("cachedUser", JSON.stringify(data));

      if (data.language)
        localStorage.setItem("preferredLanguage", data.language);
    } catch (error) {
      console.error("Fetch profile failed:", error);
      
      // Differentiate between error types
      const status = error.response?.status;
      const isNetworkError = !error.response; // No response = network error
      
      if (isNetworkError) {
        // Network error (offline, timeout, etc.) - keep session alive
        console.warn("Network error while fetching profile - keeping session active");
        const cached = sessionStorage.getItem("cachedUser");
        if (cached) {
          setUser(JSON.parse(cached));
        }
      } else if (status === 401 || status === 403) {
        // Auth error - sign out user
        console.warn("Auth error (401/403) - signing out user");
        localStorage.removeItem("token");
        localStorage.removeItem("lastActiveUpdate");
        delete axios.defaults.headers.common["Authorization"];
      } else {
        // Other server errors (5xx, etc.) - keep session, try again later
        console.warn(`Server error (${status}) - keeping session alive for retry`);
        const cached = sessionStorage.getItem("cachedUser");
        if (cached) {
          setUser(JSON.parse(cached));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLastActiveIfNeeded = async () => {
    if (wasLastActiveUpdatedToday()) return;

    try {
      await axios.post(
        `${API_URL}/api/sessions/last-active`,
        {},
        { withCredentials: true }
      );
      localStorage.setItem("lastActiveUpdate", Date.now().toString());
    } catch (error) {
      console.error("Update last active failed:", error);
    }
  };

  const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const setTokenAndUser = (token, userObj) => {
    localStorage.setItem("token", token);
    sessionStorage.setItem("cachedUser", JSON.stringify(userObj)); // Cache user data
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userObj);

    if (userObj.language)
      localStorage.setItem("preferredLanguage", userObj.language);
  };

  const signin = async (identifier, password) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(
      `${API_URL}/api/auth/signin`,
      { identifier, password, language, deviceInfo },
      { withCredentials: true }
    );

    setTokenAndUser(data.token, data.user);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(
      `${API_URL}/api/auth/signup`,
      { ...userData, language, deviceInfo },
      { withCredentials: true }
    );

    setTokenAndUser(data.token, data.user);
  };

  const googleAuth = async (credentialOrPayload, phoneNumber = null, name = null) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const payload =
      typeof credentialOrPayload === "string"
        ? { credential: credentialOrPayload }
        : credentialOrPayload;

    const { data } = await axios.post(
      `${API_URL}/api/auth/google-auth`,
      { ...payload, phoneNumber, name, language, deviceInfo },
      { withCredentials: true }
    );

    setTokenAndUser(data.token, data.user);
  };

  const signout = async () => {
    try {
      await axios.post(`${API_URL}/api/sessions/signout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Session invalidation failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("lastActiveUpdate");
      sessionStorage.removeItem("cachedUser"); // Also clear cached user data
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
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
