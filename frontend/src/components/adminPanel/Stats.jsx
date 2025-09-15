import React, { useState, useEffect } from 'react';
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
            newStats.roleStats[role].registerIds.push(user.registerId); // Dont show register IDs for users role
          }
        }
      });

      setStats(newStats);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Stats</h2>
      
      {/* Total Users */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium">Total Users: {stats.totalUsers}</h3>
        </div>
      </div>

      {/* Role Stats */}
      <div>
        <h3 className="font-medium mb-3">Roles</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register IDs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stats.roleStats).map(([role, { count, registerIds }]) => (
                <tr key={role}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{count}</td>
                  <td className="px-6 py-4 text-sm">
                    {role === 'user' ? '' : registerIds.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Language Stats */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Languages className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium">Language</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register IDs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Telugu</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{stats.languageStats.telugu.count}</td>
                <td className="px-6 py-4 text-sm">{stats.languageStats.telugu.registerIds.join(', ')}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">English</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{stats.languageStats.english.count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Bell className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium">Notifications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register IDs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Disabled</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{stats.notificationStats.disabled.count}</td>
                <td className="px-6 py-4 text-sm">{stats.notificationStats.disabled.registerIds.join(', ')}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Enabled</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{stats.notificationStats.enabled.count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RoleStatistics;
