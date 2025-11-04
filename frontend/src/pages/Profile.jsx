import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LogOut, Edit2 } from 'lucide-react';
import { API_URL } from '../utils/config';
import ProfileImageDialog from '../components/profile/ProfileImageDialog';
import ProfileDetails from '../components/profile/ProfileDetails';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';

function Profile() {
  const { user, signout, updateUserData } = useAuth();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
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
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profileImage: user.profileImage || null
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
    e?.preventDefault?.();

    // Email validation (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      return toast.error('Please enter a valid email address');
    }

    // Phone number validation
    const phoneRegex = /^(?=(?:.*\d){8,})[+\-\d\s()]*$/;;
    if (!phoneRegex.test(userData.phoneNumber)) {
      return toast.error('Please enter a valid phone number');
    }

    try {
      setIsUpdatingProfile(true);
      const { data } = await axios.patch(`${API_URL}/api/users/profile`, userData);
      updateUserData(data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleImageUpload = async (imageData) => {
    try {
      if (imageData === null) {
        await axios.delete(`${API_URL}/api/users/profile/image`);
        setUserData((p) => ({ ...p, profileImage: null }));
        updateUserData({ ...user, profileImage: null });
        toast.success('Profile image deleted successfully');
      } else {
        // imageData include profileImage, profileImagePublicId
        const { data } = await axios.post(
          `${API_URL}/api/users/profile/image`,
          imageData
        );
        setUserData((p) => ({ ...p, profileImage: data.profileImage }));
        updateUserData({ ...user, profileImage: data.profileImage });
        toast.success('Profile image updated successfully');
      }
      setShowImageDialog(false);
    } catch (error) {
      toast.error(imageData === null ? 'Failed to delete profile image' : 'Failed to update profile image');
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

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
      <div className="bg-white shadow overflow-hidden rounded-lg">
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
            {showImageDialog && (
              <ProfileImageDialog
                image={userData.profileImage}
                onClose={() => setShowImageDialog(false)}
                onUpload={handleImageUpload}
              />
            )}

            <ProfileDetails
              user={user}
              isEditing={isEditing}
              userData={userData}
              handleUserDataChange={handleUserDataChange}
              handleUpdateProfile={handleUpdateProfile}
              isUpdatingProfile={isUpdatingProfile}
              onImageClick={() => setShowImageDialog(true)}
            />
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 space-x-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-300  hover:bg-gray-50"
          >
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
            <PasswordChangeForm
              passwordData={passwordData}
              showPasswords={showPasswords}
              togglePasswordVisibility={togglePasswordVisibility}
              handlePasswordChange={handlePasswordChange}
              handleSubmit={handleSubmit}
              isUpdatingPassword={isUpdatingPassword}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
