import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [timeLeft, setTimeLeft] = useState(45); // Countdown timer starting at 50 seconds

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer); 
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-12 p-8 bg-white rounded-xl shadow-md max-w-lg mx-auto border border-gray-200">

        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Server is Starting
        </h1>

        <p className="text-lg text-gray-700 font-medium text-center mb-4">
          <span className="font-semibold text-gray-800">
            Since no one has used the app in the last 15 minutes, the server went to sleep.
          </span>
        </p>
        <p className="text-md text-gray-600 text-center mb-6">
          Server is waking up. Please wait...
        </p>

        {/* Progress Bar */}
        <div className="relative w-full h-6 bg-gray-300 rounded-full overflow-hidden mb-6">
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{
              width: `${(45 - timeLeft) / 45 * 100}%`,
              transition: 'width 1s linear',
            }}
          ></div>
        </div>

        {/* Countdown */}
        <p className="text-lg font-bold text-center">
          <span className="text-gray-800">APP starts in:</span>{' '}
          <span className="text-green-600">{timeLeft} seconds</span>
        </p>
        <div className="mb-6"></div>
        <p className="text-md text-gray-600 text-center">
          Thank you for your patience...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return children;
}

export default ProtectedRoute;
