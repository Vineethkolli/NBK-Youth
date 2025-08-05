import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, Laptop2Icon } from 'lucide-react';
import { useMaintenanceMode } from '../../context/MaintenanceModeContext';

// Utility to convert local datetime string (from <input type="datetime-local">) to UTC ISO string
function localDateTimeToUTCString(localDateTimeStr) {
  if (!localDateTimeStr) return null;

  const [date, time] = localDateTimeStr.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  const localDate = new Date();
  localDate.setFullYear(year);
  localDate.setMonth(month - 1); // Month is 0-indexed
  localDate.setDate(day);
  localDate.setHours(hour);
  localDate.setMinutes(minute);
  localDate.setSeconds(0);
  localDate.setMilliseconds(0);

  return localDate.toISOString();
}

function MaintenanceMode() {
  const { isMaintenanceMode, expectedBackAt, toggleMaintenanceMode } = useMaintenanceMode();
  const [localExpectedBackAt, setLocalExpectedBackAt] = useState(expectedBackAt || '');

  useEffect(() => {
    setLocalExpectedBackAt(expectedBackAt || '');
  }, [expectedBackAt]);

  const handleToggle = async () => {
    try {
      const expectedBackAtUTC = !isMaintenanceMode && localExpectedBackAt
        ? localDateTimeToUTCString(localExpectedBackAt)
        : null;

      await toggleMaintenanceMode(!isMaintenanceMode, expectedBackAtUTC);
      toast.success(`Maintenance mode ${!isMaintenanceMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle maintenance mode');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Maintenance Mode
      </h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 mb-2">
            When enabled, all users except the developer will see the maintenance page alone.
          </p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isMaintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <Laptop2Icon className="h-4 w-4 mr-2" />
            <span className={`w-2 h-2 rounded-full mr-2 ${isMaintenanceMode ? 'bg-red-500' : 'bg-green-500'}`} />
            {isMaintenanceMode ? 'Offline' : 'Online'}
          </div>
          {!isMaintenanceMode && (
            <div className="mt-4">
              <label htmlFor="expectedBackAt" className="block text-sm font-medium text-gray-700">
                Expected Service Return Time:
              </label>
              <input
                id="expectedBackAt"
                type="datetime-local"
                value={localExpectedBackAt}
                onChange={(e) => setLocalExpectedBackAt(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-md ${isMaintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
        >
          {isMaintenanceMode ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

export default MaintenanceMode;
