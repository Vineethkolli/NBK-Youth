import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import { Users, Mail, Globe, Bell } from 'lucide-react';

const UserStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users`);

      const newStats = {
        totalUsers: data.length,
        languageStats: { english: 0, telugu: 0 },
        notificationStats: { enabled: 0, disabled: 0 },
        roleStats: {
          admin: { count: 0, registerIds: [] },
          developer: { count: 0, registerIds: [] },
          financier: { count: 0, registerIds: [] },
          user: { count: 0, registerIds: [] }
        },
        categoryStats: { youth: 0, general: 0 },
        googleStats: { linked: 0, notLinked: 0 },
        emailStats: { withEmail: 0, withoutEmail: 0 }
      };

      data.forEach((user) => {
        if (user.language === 'te') {
          newStats.languageStats.telugu++;
        } else {
          newStats.languageStats.english++;
        }

        if (user.notificationsEnabled) {
          newStats.notificationStats.enabled++;
        } else {
          newStats.notificationStats.disabled++;
        }

        if (newStats.roleStats[user.role]) {
          newStats.roleStats[user.role].count++;
          if (user.role !== 'user') {
            newStats.roleStats[user.role].registerIds.push(user.registerId);
          }
        }

        if (user.category === 'youth') newStats.categoryStats.youth++;
        if (user.category === 'general') newStats.categoryStats.general++;

        if (user.googleId) {
          newStats.googleStats.linked++;
        } else {
          newStats.googleStats.notLinked++;
        }

        if (user.email && user.email.trim() !== '') {
          newStats.emailStats.withEmail++;
        } else {
          newStats.emailStats.withoutEmail++;
        }
      });

      setStats(newStats);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats)
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">

      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
        <Users className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="font-medium text-lg">
          Total Users: <span className="notranslate">{stats.totalUsers}</span>
        </h3>
      </div>

      <Section title="Roles">
        <Table
          headers={['Role', 'Count', 'Register IDs']}
          rows={Object.entries(stats.roleStats).map(([role, obj]) => [
            role,
            obj.count,
            role === 'user' ? '' : obj.registerIds.join(', ')
          ])}
        />
      </Section>

      <Section title="Categories">
        <Table
          headers={['Category', 'Count']}
          rows={Object.entries(stats.categoryStats).map(([category, count]) => [
            category,
            count
          ])}
        />
      </Section>

      <Section title="Emails">
        <Table
          headers={['Status', 'Count']}
          rows={[
            ['Available', stats.emailStats.withEmail],
            ['No Email', stats.emailStats.withoutEmail]
          ]}
        />
      </Section>

      <Section title="Languages">
        <Table
          headers={['Language', 'Count']}
          rows={[
            ['English', stats.languageStats.english],
            ['Telugu', stats.languageStats.telugu]
          ]}
        />
      </Section>

      <Section title="Notifications">
        <Table
          headers={['Status', 'Count']}
          rows={[
            ['Enabled', stats.notificationStats.enabled],
            ['Disabled', stats.notificationStats.disabled]
          ]}
        />
      </Section>

      <Section title="Google Accounts">
        <Table
          headers={['Status', 'Count']}
          rows={[
            ['Linked', stats.googleStats.linked],
            ['Not Linked', stats.googleStats.notLinked]
          ]}
        />
      </Section>

    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h3 className="font-medium mb-3 text-lg">{title}</h3>
    {children}
  </div>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {rows.map((cols, i) => (
          <tr key={i}>
            {cols.map((col, j) => (
              <td key={j} className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                {col}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UserStats;
