import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Trash2,
  Bell,
  BellOff,
  Edit2,
  Search,
  CheckCircle,
  XCircle,
  UsersIcon,
  BarChart3,
  Fingerprint,
  ChevronDown,
  ChevronRight,
  Columns,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/config';
import UpdateUserForm from '../components/users/UpdateUserForm';
import DeleteUserConfirm from '../components/users/DeleteUserForm';
import UserStats from '../components/users/UserStats';
import UserFilters from '../components/users/UserFilters';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { formatBirthday } from '../components/profile/BirthdayInput';

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const { hasAccess } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToInvalidate, setUserToInvalidate] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    category: '',
    googleLinked: '',
    notifications: '',
    language: '',
  });
  const [visibleColumns, setVisibleColumns] = useState({
    registerId: true,
    name: true,
    role: true,
    category: true,
    email: false,
    phoneNumber: false,
    birthday: false,
    google: false,
    notifications: false,
    language: false,
  });

  if (!hasAccess('Privileged'))
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [search, filters, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...filters });
      const { data } = await axios.get(`${API_URL}/api/users?${params}`);
      setUsers(data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
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

  const handleInvalidateSessions = async (user) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/sessions/user/${user._id}/invalidate`);
      toast.success(`${data.invalidatedCount} session${data.invalidatedCount === 1 ? '' : 's'} invalidated`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invalidate sessions');
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenPanel(openPanel === 'filters' ? null : 'filters')}
              className="flex items-center gap-3 px-3 py-1 bg-white rounded-md shadow border"
            >
              <span className="font-medium flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                Filters
              </span>
              {openPanel === 'filters' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => setOpenPanel(openPanel === 'columns' ? null : 'columns')}
              className="flex items-center gap-3 px-3 py-1 bg-white rounded-md shadow border"
            >
              <span className="font-medium flex items-center gap-2">
                <Columns className="h-4 w-4 text-gray-600" />
                Columns
              </span>
              {openPanel === 'columns' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {openPanel === 'filters' && (
            <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
              <UserFilters filters={filters} onChange={setFilters} />
            </div>
          )}

          {openPanel === 'columns' && (
            <div className="bg-white rounded-lg shadow p-2 border animate-fadeIn">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.entries(visibleColumns).map(([column, isVisible]) => (
                  <label key={column} className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleColumnToggle(column)}
                      className="form-checkbox"
                    />
                    <span className="ml-2 capitalize">
                      {column === 'registerId' ? 'Reg ID' : column}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 whitespace-nowrap">
                  <tr>
                    {visibleColumns.registerId && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">REG ID</th>}
                    {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>}
                    {visibleColumns.email && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>}
                    {visibleColumns.phoneNumber && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>}
                    {visibleColumns.birthday && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birthday</th>}
                    {visibleColumns.role && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>}
                    {visibleColumns.category && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>}
                    {visibleColumns.google && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Google</th>}
                    {visibleColumns.notifications && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notifications</th>}
                    {visibleColumns.language && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>}
                    {hasAccess('Developer') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      {visibleColumns.registerId && <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {user.registerId}
                      </td>}
                      {visibleColumns.name && <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                        {user.category === 'villager' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-300 text-green-900 ml-1">
                            V
                          </span>
                        )}
                      </td>}

                      {visibleColumns.email && <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {user.email || 'N/A'}
                      </td>}

                      {visibleColumns.phoneNumber && <td className="px-4 py-3 whitespace-nowrap text-sm notranslate">
                        {formatPhone(user.phoneNumber)}
                      </td>}

                      {visibleColumns.birthday && <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatBirthday(user.birthday)}
                      </td>}

                      {visibleColumns.role && <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                      </td>}

                      {visibleColumns.category && <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <select
                          value={user.category}
                          onChange={(e) => handleCategoryChange(user._id, e.target.value)}
                          disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300
                                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                                     sm:text-sm rounded-md"
                        >
                          <option value="youth">Youth</option>
                          <option value="villager">Villager</option>
                          <option value="general">General</option>
                        </select>
                      </td>}

                      {visibleColumns.google && <td className="px-4 py-3 text-center">
                        {user.googleId ? (
                          <CheckCircle className="h-5 w-5 text-green-600" title="Google Linked" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" title="Not Linked" />
                        )}
                      </td>}

                      {visibleColumns.notifications && <td className="px-4 py-3 text-center">
                        {user.notificationsEnabled ? (
                          <Bell className="h-5 w-5 text-green-600" title="Enabled" />
                        ) : (
                          <BellOff className="h-5 w-5 text-gray-400" title="Disabled" />
                        )}
                      </td>}

                      {visibleColumns.language && <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {user.language === 'te' ? 'Telugu' : 'English'}
                      </td>}

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
                            onClick={() => setUserToInvalidate(user)}
                            disabled={user.email === 'gangavaramnbkyouth@gmail.com'}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Invalidate all sessions"
                            aria-label={`Invalidate all sessions for ${user.name}`}
                          >
                            <Fingerprint className="h-5 w-5" />
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

          {userToInvalidate && (
            <DeleteUserConfirm
              user={userToInvalidate}
              action="invalidate"
              onClose={() => setUserToInvalidate(null)}
              onConfirm={handleInvalidateSessions}
            />
          )}
        </>
      )}

      {activeTab === 'stats' && <UserStats />}
    </div>
  );
}

export default Users;
