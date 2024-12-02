import { useAuth } from '../context/AuthContext';

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
            Welcome to your dashboard. You are logged in as a {user.role}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;