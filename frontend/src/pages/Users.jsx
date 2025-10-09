import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/config';

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users${search ? `?search=${search}` : ''}`);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (currentUser.role == 'user') {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Users & Roles</h1>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notifications</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">{user.registerId}</td>
                 <td className="px-5 py-3 whitespace-nowrap text-sm">
  {user.name}{' '}
  {(user.role === 'admin' || user.role === 'developer' || user.role === 'financier') && (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-300 text-red-900 ml-1">
      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    </span>
  )}
  {user.category === 'youth' && (
    <span className="inline-flex items-center px-1.5 py-0 rounded-full text-xs font-medium bg-yellow-300 text-yellow-900 ml-1">
      Y
    </span>
  )}
</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">{user.email || 'N/A'}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">{user.phoneNumber}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="financier">Financier</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">
                    <select
                      value={user.category}
                      onChange={(e) => handleCategoryChange(user._id, e.target.value)}
                      disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="youth">Youth</option>
                      <option value="general">General</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    {user.notificationsEnabled ? (
                      <Bell className="h-5 w-5 text-green-600" title="Notifications Enabled" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-400" title="Notifications Disabled" />
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;
