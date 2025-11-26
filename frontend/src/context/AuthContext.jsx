import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { getDeviceInfo } from "../utils/deviceInfo";
import { Access } from "../utils/access";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/profile/profile`);
      setUser(data);

      if (data.language)
        localStorage.setItem("preferredLanguage", data.language);
    } catch {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

    const updateUserData = (newData) => {
    setUser((prev) => ({ ...(prev || {}), ...newData }));
  };

  const setTokenAndUser = (token, userObj) => {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userObj);

    if (userObj.language) {
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

    setTokenAndUser(data.token, data.user);
  };

  const signup = async (userData) => {
    const language = localStorage.getItem("preferredLanguage") || "en";
    const deviceInfo = await getDeviceInfo();

    const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
      ...userData,
      language,
      deviceInfo,
    });

    setTokenAndUser(data.token, data.user);
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

    setTokenAndUser(data.token, data.user);
  };

  const signout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
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
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
