import { useAuth } from '../context/AuthContext';

export default function Documentation() {
  const { hasAccess } = useAuth();

    if (!hasAccess('Developer'))  {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }


  return (
      <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Documentation
        </h1>
        <p className="mt-3 text-gray-600">
          Documentation is currently in progress. 
        </p>

        <p className="mt-6 text-gray-600"> 
          This section will provide a central reference for understanding, 
          maintaining, and managing the application, including its structure, features, configuration, services, 
          maintenance procedures, and operational guidelines.
        </p>
      </div>
    </div>
  );
}
