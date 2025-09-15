import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, Laptop2Icon } from 'lucide-react';
import { useMaintenanceMode } from '../../context/MaintenanceModeContext';

function MaintenanceMode() {
  const { isMaintenanceMode, expectedBackAt, toggleMaintenanceMode } = useMaintenanceMode();
  const [localExpectedBackAt, setLocalExpectedBackAt] = useState(expectedBackAt || '');

  useEffect(() => {
    setLocalExpectedBackAt(expectedBackAt || '');
  }, [expectedBackAt]);

  const handleToggle = async () => {
    try {
      const expectedBackAtISO =
        !isMaintenanceMode && localExpectedBackAt
          ? new Date(localExpectedBackAt).toISOString()
          : null;
      await toggleMaintenanceMode(!isMaintenanceMode, expectedBackAtISO);
      toast.success(`Maintenance mode ${!isMaintenanceMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle maintenance mode');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-2 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Maintenance Mode
      </h2>

      <p className="text-gray-600 mb-4">
        When enabled, all users except the developer will see the maintenance page alone.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mb-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <label
            htmlFor="expectedBackAt"
            className="block text-sm font-medium text-gray-700"
          >
            Expected Service Return Time:
          </label>
          <input
            id="expectedBackAt"
            type="datetime-local"
            value={localExpectedBackAt}
            onChange={
              isMaintenanceMode
                ? undefined
                : (e) => setLocalExpectedBackAt(e.target.value)
            }
            className="mt-0.5 block border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            readOnly={isMaintenanceMode}
            disabled={isMaintenanceMode}
          />
        </div>

        <div className="flex items-center justify-center flex-wrap gap-3 space-x-8">
          <div
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm ${
              isMaintenanceMode
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            <Laptop2Icon className="h-4 w-4 mr-2" />
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                isMaintenanceMode ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
            {isMaintenanceMode ? 'Offline' : 'Online'}
          </div>

          <button
            onClick={handleToggle}
            className={`px-3 py-2 rounded-md ${
              isMaintenanceMode
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {isMaintenanceMode ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaintenanceMode;
