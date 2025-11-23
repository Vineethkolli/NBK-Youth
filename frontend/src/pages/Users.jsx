import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Bell, BellOff, Edit2, Search, CheckCircle, XCircle, UsersIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/config';
import UpdateUserForm from '../components/users/UpdateUserForm';
import DeleteUserConfirm from '../components/users/DeleteUserForm';
import UserStats from '../components/users/UserStats';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const { hasAccess } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);

  if (!hasAccess('Privileged'))
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [search, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/users${search ? `?search=${search}` : ''}`
      );
      setUsers(data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API_URL}/api/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleCategoryChange = async (userId, newCategory) => {
    try {
      await axios.patch(`${API_URL}/api/users/${userId}/category`, { category: newCategory });
      toast.success('Category updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const formatPhone = (number) => {
    if (!number) return 'N/A';
    try {
      const parsed = parsePhoneNumberFromString(number);
      return parsed && parsed.isValid() ? parsed.formatInternational() : number;
    } catch {
      return number;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
  <h1 className="text-2xl font-semibold">Users & Roles</h1>

  <div className="flex items-center gap-2">
    <button
      onClick={() => setActiveTab('users')}
      className={`px-2 py-2 rounded-md font-semibold flex items-center ${
        activeTab === 'users'
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      <UsersIcon className="h-4 w-4 mr-1" />
      Users
    </button>

    <button
      onClick={() => setActiveTab('stats')}
      className={`px-2 py-2 rounded-md font-semibold flex items-center ${
        activeTab === 'stats'
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      <BarChart3 className="h-4 w-4 mr-1" />
      Stats
    </button>
  </div>
</div>

      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-1 w-full border rounded-lg"
            />
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Google</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notifications</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                    {hasAccess('Developer') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {user.registerId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {user.name}{' '}
                        {['developer', 'financier', 'admin'].includes(user?.role) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-300 text-red-900 ml-1">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                        {user.category === 'youth' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-300 text-yellow-900 ml-1">
                            Y
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {user.email || 'N/A'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {formatPhone(user.phoneNumber)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300
                                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                                     sm:text-sm rounded-md"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="financier">Financier</option>
                          <option value="developer">Developer</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <select
                          value={user.category}
                          onChange={(e) => handleCategoryChange(user._id, e.target.value)}
                          disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300
                                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                                     sm:text-sm rounded-md"
                        >
                          <option value="youth">Youth</option>
                          <option value="general">General</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {user.googleId ? (
                          <CheckCircle className="h-5 w-5 text-green-600" title="Google Linked" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" title="Not Linked" />
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {user.notificationsEnabled ? (
                          <Bell className="h-5 w-5 text-green-600" title="Enabled" />
                        ) : (
                          <BellOff className="h-5 w-5 text-gray-400" title="Disabled" />
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {user.language === 'te' ? 'Telugu' : 'English'}
                      </td>

                      {hasAccess('Developer') && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(user)}
                            disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingUser && (
            <UpdateUserForm
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onUpdated={(updatedUser) => {
                setUsers((prev) =>
                  prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
                );
              }}
            />
          )}

          {userToDelete && (
            <DeleteUserConfirm
              user={userToDelete}
              onClose={() => setUserToDelete(null)}
              onConfirm={async (user) => {
                try {
                  await axios.delete(`${API_URL}/api/users/${user._id}`);
                  toast.success(`User "${user.name}" deleted successfully`);
                  fetchUsers();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to delete user');
                }
              }}
            />
          )}
        </>
      )}

      {activeTab === 'stats' && <UserStats />}
    </div>
  );
}

export default Users;
