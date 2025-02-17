import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import PaymentDetails from '../components/developer/PaymentDetails';
import ClearData from '../components/developer/ClearData';

function DeveloperOptions() {
  const { user } = useAuth();
  const [roleStats, setRoleStats] = useState({});

  useEffect(() => {
    fetchRoleStats();
  }, []);

  const fetchRoleStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users`);
      const stats = {};

      // Group users by role with registerIds
      data.forEach((user) => {
        const role = user.role;
        if (stats[role]) {
          stats[role].count++;
          stats[role].registerIds.push(user.registerId);
        } else {
          stats[role] = { count: 1, registerIds: [user.registerId] };
        }
      });

      setRoleStats(stats);
    } catch (error) {
      toast.error('Failed to fetch role statistics');
    }
  };

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Role Statistics Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Role Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Register IDs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(roleStats).map(([role, { count, registerIds }]) => (
                <tr key={role}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {registerIds.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Section */}
      <PaymentDetails />

      {/* Clear Data Section */}
      <ClearData />
    </div>
  );
}

export default DeveloperOptions;
