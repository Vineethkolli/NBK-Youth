
import { useEffect, useState } from "react";
import { API_URL } from "../../utils/config";

const BackendStatus = ({ children }) => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [backendDown, setBackendDown] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkBackend = async () => {
    // Internet is offline
    if (!navigator.onLine) {
      setOffline(true);
      setBackendDown(false);
      setChecking(false);
      return;
    }

    setOffline(false);
    setChecking(true);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 120000);

    try {
      const response = await fetch(`${API_URL}/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      // Backend is available
      setBackendDown(false);

      // Server is healthy again, clear the one-time reload flag
      sessionStorage.removeItem("backend-first-reload");

    } catch (error) {
      console.error("Backend unavailable:", error);

      // Backend is unavailable
      setBackendDown(true);

      // Reload only the first time the server-down state is detected
      if (!sessionStorage.getItem("backend-first-reload")) {
        sessionStorage.setItem("backend-first-reload", "true");

        window.location.reload();
        return;
      }

    } finally {
      clearTimeout(timeout);
      setChecking(false);
    }
  };

  useEffect(() => {
    // Check backend only once when app starts
    checkBackend();

    const handleOffline = () => {
      setOffline(true);
      setBackendDown(false);
      setChecking(false);
    };

    const handleOnline = () => {
      setOffline(false);

      // Check backend once when internet comes back
      checkBackend();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // --------------------------------------------------
  // USER INTERNET IS OFFLINE
  // --------------------------------------------------
  if (offline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">

          {/* App Name */}
          <h1 className="text-2xl font-bold text-yellow-700 mb-20">NBK Youth</h1>

          <div className="text-6xl mb-6">
            📡
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You're offline
          </h1>

          <p className="text-gray-600 mb-4">
            Please check your internet connection and try again.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Your internet connection appears to be unavailable.
          </p>

          <button
            onClick={checkBackend}
            disabled={checking}
            className="px-5 py-2.5 bg-indigo-600 text-white
                       rounded-lg hover:bg-indigo-700
                       disabled:opacity-50 transition"
          >
            {checking ? "Checking..." : "Refresh"}
          </button>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // BACKEND / SERVER IS DOWN
  // --------------------------------------------------
  if (backendDown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">

          {/* App Name */}
          
          <h1 className="text-2xl font-bold text-yellow-700 mb-20">NBK Youth</h1>

          <div className="text-6xl mb-6">
            🛠️
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Server Down
          </h1>

          <p className="text-gray-600 mb-4">
            We're currently experiencing a temporary service
            interruption.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Sorry for the inconvenience
          </p>

          <button
            onClick={checkBackend}
            disabled={checking}
            className="px-5 py-2.5 bg-indigo-600 text-white
                       rounded-lg hover:bg-indigo-700
                       disabled:opacity-50 transition"
          >
            {checking ? "Checking..." : "Try Again"}
          </button>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // BACKEND HEALTHY → NORMAL APP
  // --------------------------------------------------
  return children;
};

export default BackendStatus;
