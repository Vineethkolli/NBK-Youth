import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Settings } from "lucide-react";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading]);

  if (loading) {
    const progressPercent = ((45 - timeLeft) / 45) * 100;

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-200 via-lime-200 to-amber-200 px-2">
        <style>{`
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin-fast { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        `}</style>

        {/* Container */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 flex flex-col items-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-xl transition-all duration-500">
          {/* Rotating Gears */}
          <div className="relative flex items-center justify-center mb-8">
            <Settings
              className="w-24 h-24 text-green-600 drop-shadow-xl"
              strokeWidth={1.5}
              style={{ animation: "spin-slow 6s linear infinite" }}
            />
            <Settings
              className="w-10 h-10 text-emerald-500 absolute bottom-0 right-[-40px]"
              strokeWidth={1.3}
              style={{ animation: "spin-fast 2s linear infinite" }}
            />
            <Settings
              className="w-10 h-10 text-lime-500 absolute bottom-0 left-[-40px]"
              strokeWidth={1.3}
              style={{ animation: "spin-fast 2s linear infinite" }}
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-3 text-center tracking-wide">
            Starting the Server...
          </h1>

          <p className="text-base sm:text-lg text-gray-700 font-medium text-center mb-3">
            <span className="font-semibold text-gray-900">
              Server went to sleep due to inactivity 😴
            </span>
          </p>

          <p className="text-sm sm:text-md text-gray-600 text-center mb-8">
            Waking up 🚀 please wait...
          </p>

          {/* Progress Bar */}
          <div className="relative w-full h-4 bg-gray-300 rounded-full overflow-hidden shadow-inner mb-6">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Countdown */}
          <p className="text-lg sm:text-xl font-semibold text-gray-800 tracking-wide mb-2">
            App starts in{" "}
            <span className="text-green-600 font-bold">{timeLeft}s</span>
          </p>

          <p className="text-sm text-gray-600 mt-2 italic">
            Thanks for your patience 💚
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return children;
}

export default ProtectedRoute;
