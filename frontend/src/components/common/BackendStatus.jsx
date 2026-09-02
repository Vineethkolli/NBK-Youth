import { useEffect, useState } from "react";
import { API_URL } from "../../utils/config";

const BackendStatus = ({ children }) => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [backendDown, setBackendDown] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkBackend = async () => {
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

      setBackendDown(false);
    } catch (error) {
      console.error("Backend unavailable:", error);
      setBackendDown(true);
    } finally {
      clearTimeout(timeout);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();

    const handleOffline = () => {
      setOffline(true);
      setBackendDown(false);
      setChecking(false);
    };

    const handleOnline = () => {
      setOffline(false);

      checkBackend();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => {
      checkBackend();
    }, 120000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  if (offline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">

          <div className="text-6xl mb-6">
            📡
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You're offline
          </h1>

          <p className="text-gray-600 mb-4">
            Please check your internet connection and try again.
          </p>

          <p className="text-sm text-gray-500">
            The app will automatically reconnect when your internet
            connection is restored.
          </p>

        </div>
      </div>
    );
  }

  if (backendDown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">

          <div className="text-6xl mb-6">
            🛠️
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            We'll be back shortly
          </h1>

          <p className="text-gray-600 mb-4">
            We're currently experiencing a temporary service
            interruption.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Thank you for your patience and understanding.
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

  return children;
};

export default BackendStatus;
