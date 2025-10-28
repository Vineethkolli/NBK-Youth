import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { toast } from 'react-hot-toast';
import { Users, Languages, Bell } from 'lucide-react';

const RoleStatistics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    languageStats: {
      english: { count: 0, registerIds: [] },
      telugu: { count: 0, registerIds: [] }
    },
    notificationStats: {
      enabled: { count: 0, registerIds: [] },
      disabled: { count: 0, registerIds: [] }
    },
    roleStats: {
      admin: { count: 0, registerIds: [] },
      developer: { count: 0, registerIds: [] },
      financier: { count: 0, registerIds: [] },
      user: { count: 0, registerIds: [] } 
    },
    categoryStats: {
      youth: 0,
      general: 0
    }
  });

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users`);
      const newStats = {
        totalUsers: data.length,
        languageStats: {
          english: { count: 0, registerIds: [] },
          telugu: { count: 0, registerIds: [] }
        },
        notificationStats: {
          enabled: { count: 0, registerIds: [] },
          disabled: { count: 0, registerIds: [] }
        },
        roleStats: {
          developer: { count: 0, registerIds: [] },
          financier: { count: 0, registerIds: [] },
          admin: { count: 0, registerIds: [] },
          user: { count: 0, registerIds: [] } 
        },
        categoryStats: {
          youth: 0,
          general: 0
        }
      };

      data.forEach((user) => {
        // Language stats
        if (user.language === 'te') {
          newStats.languageStats.telugu.count++;
          newStats.languageStats.telugu.registerIds.push(user.registerId);
        } else {
          newStats.languageStats.english.count++;
          newStats.languageStats.english.registerIds.push(user.registerId);
        }

        // Notification stats
        if (user.notificationsEnabled) {
          newStats.notificationStats.enabled.count++;
          newStats.notificationStats.enabled.registerIds.push(user.registerId);
        } else {
          newStats.notificationStats.disabled.count++;
          newStats.notificationStats.disabled.registerIds.push(user.registerId);
        }

        // Role stats
        const role = user.role;
        if (newStats.roleStats.hasOwnProperty(role)) {
          newStats.roleStats[role].count++;
          if (role !== 'user') {
            newStats.roleStats[role].registerIds.push(user.registerId);
          }
        }

        // Category stats
        if (user.category === 'youth') newStats.categoryStats.youth++;
        else if (user.category === 'general') newStats.categoryStats.general++;
      });

      setStats(newStats);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const renderTable = (headers, rows) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Statistics</h2>

      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
        <Users className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="font-medium text-lg">
          Total Users: <span className="notranslate">{stats.totalUsers}</span>
          </h3>

      </div>

      {/* Role Stats */}
      <div>
        <h3 className="font-medium mb-3 text-lg">Roles</h3>
        {renderTable(
          ['Role', 'Count', 'Register IDs'],
          Object.entries(stats.roleStats).map(([role, { count, registerIds }]) => (
            <tr key={role}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                {role}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{count}</td>
              <td className="px-6 py-4 text- notranslate">{role === 'user' ? '' : registerIds.join(', ')}</td>
            </tr>
          ))
        )}
      </div>

      {/* Category Stats */}
      <div>
        <h3 className="font-medium mb-3 text-lg">Categories</h3>
        {renderTable(
          ['Category', 'Count'],
          Object.entries(stats.categoryStats).map(([category, count]) => (
            <tr key={category}>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{category}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{count}</td>
            </tr>
          ))
        )}
      </div>

      {/* Language Stats */}
<div>
  <div className="flex items-center mb-3">
    <Languages className="h-5 w-5 text-gray-600 mr-2" />
    <h3 className="font-medium text-lg">Languages</h3>
  </div>
  {renderTable(
    ['Language', 'Count', 'Register IDs'],
    <>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm">Telugu</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{stats.languageStats.telugu.count}</td>
        <td className="px-6 py-4 text-sm notranslate">{stats.languageStats.telugu.registerIds.join(', ')}</td>
      </tr>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm">English</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{stats.languageStats.english.count}</td>
        <td className="px-6 py-4 text-sm notranslate"></td>
      </tr>
    </>
  )}
</div>


      {/* Notification Stats */}
      <div>
        <div className="flex items-center mb-3">
          <Bell className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium text-lg">Notifications</h3>
        </div>
        {renderTable(
          ['Status', 'Count', 'Register IDs'],
          <>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm">Disabled</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{stats.notificationStats.disabled.count}</td>
              <td className="px-6 py-4 text-sm notranslate">{stats.notificationStats.disabled.registerIds.join(', ')}</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm">Enabled</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm notranslate">{stats.notificationStats.enabled.count}</td>
              <td className="px-6 py-4 text-sm notranslate">{stats.notificationStats.enabled.registerIds.join(', ')}</td>
            </tr>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleStatistics;
