import { useEffect, useState } from "react";
import { API_URL } from "../utils/config";

const BackendStatus = ({ children }) => {
  const [backendDown, setBackendDown] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkBackend = async () => {
    try {
      setChecking(true);

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 60000);

      const response = await fetch(`${API_URL}/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      setBackendDown(false);
    } catch (error) {
      console.error("Backend unavailable:", error);
      setBackendDown(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();

    const interval = setInterval(() => {
      checkBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (backendDown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">

          {/* Icon */}
          <div className="text-6xl mb-6">
            🛠️
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            We'll be back shortly
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-4">
            We're currently experiencing a temporary service
            interruption. Services are back
            by <strong>September 1, 2026 at 6:00 AM IST</strong>.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Thank you for your patience and understanding.
          </p>

          {/* Try Again */}
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