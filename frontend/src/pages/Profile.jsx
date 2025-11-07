import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LogOut, Edit2 } from 'lucide-react';
import { API_URL } from '../utils/config';
import ProfileImageDialog from '../components/profile/ProfileImageDialog';
import ProfileDetails from '../components/profile/ProfileDetails';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import { parsePhoneNumberFromString } from "libphonenumber-js";

function Profile() {
  const { user, signout, updateUserData } = useAuth();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false); 

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

  const passwordFormRef = useRef(null);

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

    const normalizedEmail = userData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return toast.error("Please enter a valid email address");
    }

    let phoneNumber = userData.phoneNumber.trim();
    let finalPhoneNumber = phoneNumber;

    if (user.email !== 'gangavaramnbkyouth@gmail.com') {
      let normalized = phoneNumber.replace(/^00/, "+").replace(/[\s-]+/g, "");
      let parsed;

      if (normalized.startsWith("+")) {
        parsed = parsePhoneNumberFromString(normalized);
      } else if (/^\d{6,15}$/.test(normalized)) {
        parsed = parsePhoneNumberFromString(`+${normalized}`);
      }

      if (!parsed || !parsed.isValid()) {
        return toast.error("Please enter a valid phone number in international format");
      }

      finalPhoneNumber = parsed.number;
    }

    try {
      setIsUpdatingProfile(true);
      const { data } = await axios.patch(`${API_URL}/api/profile/profile`, {
        ...userData,
        email: normalizedEmail,
        phoneNumber: finalPhoneNumber,
      });
      updateUserData(data);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleImageUpload = async (imageData) => {
    try {
      if (imageData === null) {
        await axios.delete(`${API_URL}/api/profile/image`);
        setUserData((p) => ({ ...p, profileImage: null }));
        updateUserData({ ...user, profileImage: null });
        toast.success('Profile image deleted successfully');
      } else {
        const { data } = await axios.post(`${API_URL}/api/profile/image`, imageData);
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
      await axios.post(`${API_URL}/api/profile/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const toggleChangePassword = () => {
    setIsChangingPassword((prev) => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => {
          passwordFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return newState;
    });
  };

  const confirmSignout = () => {
    setShowSignoutConfirm(true);
  };

  const handleConfirmSignout = () => {
    setShowSignoutConfirm(false);
    signout();
  };

  const handleCancelSignout = () => {
    setShowSignoutConfirm(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-2xl font-semibold">
            Profile
            {user.category === 'youth' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-300 text-yellow-900">
                Youth
              </span>
            )}
          </h3>
          <div className="space-x-2">
            <button
              onClick={confirmSignout}
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
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-300 hover:bg-gray-50"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>

          <button
            onClick={toggleChangePassword}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {isChangingPassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {isChangingPassword && (
          <div ref={passwordFormRef} className="px-4 py-5 sm:px-6">
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

      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-90">
            <h2 className="text-lg font-medium mb-4">Are you sure you want to sign out?</h2>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCancelSignout}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignout}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
