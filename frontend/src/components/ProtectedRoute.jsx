import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-6 relative overflow-hidden">
        <style>{`
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin-fast { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        `}</style>

        <div className="relative flex items-center justify-center mb-10">
          <Settings
            className="w-20 h-20 text-green-600 drop-shadow-lg"
            strokeWidth={1.5}
            style={{
              animation: 'spin-slow 5s linear infinite',
            }}
          />
          <Settings
            className="w-10 h-10 text-emerald-500 absolute bottom-0 right-[-40px]"
            strokeWidth={1.3}
            style={{
              animation: 'spin-fast 1.8s linear infinite',
            }}
          />
          <Settings
            className="w-10 h-10 text-lime-500 absolute bottom-0 left-[-40px]"
            strokeWidth={1.3}
            style={{
              animation: 'spin-fast 1.8s linear infinite',
            }}
          />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-800 mb-3 text-center tracking-wide">
          Starting the Server...
        </h1>

        <p className="text-lg text-gray-700 font-medium text-center max-w-xl mb-3">
          <span className="font-semibold text-gray-900">
            Server went to sleep due to inactivity😴
          </span>
        </p>

        <p className="text-md text-gray-600 text-center mb-8">
          Waking up 🚀 please wait...
        </p>

        <div className="relative w-full max-w-lg h-4 bg-gray-300 rounded-full overflow-hidden shadow-inner mb-6">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p className="text-xl font-semibold text-gray-800 tracking-wide mb-2">
          App starts in{' '}
          <span className="text-green-600 font-bold">{timeLeft}s</span>
        </p>

        <p className="text-sm text-gray-600 mt-2 italic">
          Thanks for your patience 💚
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/gangavaram" />;
  }

  return children;
}

export default ProtectedRoute;
