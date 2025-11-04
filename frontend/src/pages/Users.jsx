import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Bell, BellOff, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/config';
import UpdateUserForm from '../components/users/UpdateUserForm';
import DeleteUserConfirm from '../components/users/DeleteUserForm';

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  if (currentUser.role === 'user') {
    return <div>Access denied</div>;
  }

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/users${search ? `?search=${search}` : ''}`
      );
      setUsers(data);
    } catch {
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notifications</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                {currentUser.role === 'developer' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
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
                    {user.phoneNumber || 'N/A'}
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

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {user.notificationsEnabled ? (
                      <Bell className="h-5 w-5 text-green-600" title="Notifications Enabled" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-400" title="Notifications Disabled" />
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.language === 'te' ? 'Telugu' : user.language === 'en' ? 'English' : 'N/A'}
                  </td>             

                  {currentUser.role === 'developer' && (
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
    </div>
  );
}

export default Users;
