import { createContext, useContext, useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { getDeviceInfo } from "../utils/deviceInfo";
import { Access } from "../utils/access";
import { setAccessToken, clearAccessToken, initializeAuth, logoutUser } from "../utils/auth";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication on app load
    const init = async () => {
      try {
        const userData = await initializeAuth();
        if (userData) {
          setUser(userData);
          if (userData.language) {
            localStorage.setItem("preferredLanguage", userData.language);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/api/profile/profile`);
      setUser(data);

      if (data.language)
        localStorage.setItem("preferredLanguage", data.language);
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

    const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const setTokenAndUser = (accessToken, userObj) => {
    setAccessToken(accessToken);
    setUser(userObj);

    if (userObj.language) {
      localStorage.setItem("preferredLanguage", userObj.language);
    }
  };

  const signin = async (identifier, password) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await api.post(`/api/auth/signin`, {
      identifier,
      password,
      language,
      deviceInfo,
    });

    setTokenAndUser(data.accessToken, data.user);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await api.post(`/api/auth/signup`, {
      ...userData,
      language,
      deviceInfo,
    });

    setTokenAndUser(data.accessToken, data.user);
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

    const { data } = await api.post(`/api/auth/google-auth`, {
      ...payload,
      phoneNumber,
      name,
      language,
      deviceInfo,
    });

    setTokenAndUser(data.accessToken, data.user);
  };

  const signout = async () => {
    await logoutUser();
    setUser(null);
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
      fetchProfile,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
