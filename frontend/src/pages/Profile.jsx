import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LogOut, Save, Eye, EyeOff, Edit2 } from 'lucide-react';
import { API_URL } from '../utils/config';
import ProfileImage from '../components/profile/ProfileImage';
import ProfileImageDialog from '../components/profile/ProfileImageDialog';

function Profile() {
  const { user, signout, updateUserData } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    profileImage: user?.profileImage || null
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name,
        email: user.email || '',
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage
      });
    }
  }, [user]);

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUserDataChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Email validation (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      return toast.error('Please enter a valid email address');
    }

    // Phone number validation
    const phoneRegex = /^(?=(?:.*\d){8,})[\+\-\d\s\(\)]*$/;
    if (!phoneRegex.test(userData.phoneNumber)) {
      return toast.error('Please enter a valid phone number');
    }

    try {
      const { data } = await axios.patch(`${API_URL}/api/users/profile`, userData);
      updateUserData(data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleImageUpload = async (imageData) => {
    try {
      if (imageData === null) {
        // Handle deletion
        const { data } = await axios.delete(`${API_URL}/api/users/profile/image`);
        setUserData({ ...userData, profileImage: null });
        updateUserData({ ...user, profileImage: null });
        toast.success('Profile image deleted successfully');
      } else {
        // Handle upload/update (imageData contains direct-upload metadata)
        const { data } = await axios.post(
          `${API_URL}/api/users/profile/image`,
          imageData
        );
        setUserData({ ...userData, profileImage: data.profileImage });
        updateUserData({ ...user, profileImage: data.profileImage });
        toast.success('Profile image updated successfully');
      }
      setShowImageDialog(false);
    } catch (error) {
      toast.error(imageData === null ? 'Failed to delete profile image' : 'Failed to update profile image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 4) {
      return toast.error('Password must be at least 4 characters long');
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setIsUpdatingPassword(true); 
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false); 
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profile
            {user.category === 'youth' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-300 text-yellow-900">
                Youth
              </span>
            )}
          </h3>
          <div className="space-x-2">
            <button
              onClick={signout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-center mb-6">
              <ProfileImage
                image={userData.profileImage}
                onClick={() => setShowImageDialog(true)}
              />
            </div>

            {showImageDialog && (
              <ProfileImageDialog
                image={userData.profileImage}
                onClose={() => setShowImageDialog(false)}
                onUpload={handleImageUpload}
              />
            )}

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleUserDataChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleUserDataChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleUserDataChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </button>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Register ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 notranslate">{user.registerId}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email || 'Not provided'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.phoneNumber}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 space-x-4">
           <button
  onClick={() => setIsEditing(!isEditing)}
  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-300  hover:bg-gray-50">
  <Edit2 className="mr-2 h-4 w-4" />
  {isEditing ? 'Cancel' : 'Edit Profile'}
</button>
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {isChangingPassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {isChangingPassword && (
          <div className="px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.currentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    required
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.currentPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.newPassword ? 'text' : 'password'}
                    name="newPassword"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.newPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.confirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
