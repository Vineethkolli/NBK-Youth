import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Wrench, Settings } from 'lucide-react';
import { API_URL } from '../utils/config';

function MaintenancePage() {
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/maintenance/status`);
        setMaintenanceData(data);
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
      }
    };

    fetchStatus();
  }, []);

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-gray-200 flex items-center justify-center px-3">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-2xl p-8 text-center transform transition-all duration-500 hover:scale-105">
        <div className="relative flex justify-center mb-6">
          <Settings className="h-24 w-24 text-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
          <Wrench className="h-16 w-16 text-blue-500 absolute -bottom-4 -right-4 transform rotate-45 animate-bounce" />
          <AlertTriangle className="h-12 w-12 text-red-500 absolute -top-4 -left-4 transform -rotate-12 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Scheduled Maintenance</h1>
        <p className="text-gray-700 mb-6">
          We are currently undergoing scheduled maintenance to improve our services. Please check back soon.
        </p>
        {maintenanceData && maintenanceData.expectedBackAt && (
          <p className="text-gray-800">
            Services are live on  {formatDateTime(maintenanceData.expectedBackAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default MaintenancePage;
