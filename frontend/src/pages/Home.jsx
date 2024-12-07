import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Hello, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to NBK Youth Web APP.
          </p>
        </div>
      </div>

      <div className="bg-gray-100 border-t border-gray-200 mt-6 rounded-lg">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <h2 className="text-xl font-medium text-gray-800">
            Current Mode:
          </h2>
          <div className="mt-2 flex items-center">
            <div className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full shadow">
              Development & Testing
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
           Raise Concerns, Recommend Enhancements, Share Your Thoughts
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;