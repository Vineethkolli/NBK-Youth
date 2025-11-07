import { Camera } from 'lucide-react';
import { AsYouType } from 'libphonenumber-js';
import ProfilePhoneInput from "./PhoneInput";

function ProfileDetails({
  user,
  isEditing,
  userData,
  handleUserDataChange,
  handleUpdateProfile,
  isUpdatingProfile,
  onImageClick
}) {
  function Avatar({ image, onClick }) {
    return (
      <div className="flex justify-center mb-6">
        <div className="relative inline-block">
          {image ? (
            <img
              src={image}
              alt="Profile"
              onClick={onClick}
              className="w-32 h-32 rounded-full object-cover cursor-pointer"
            />
          ) : (
            <div
              onClick={onClick}
              className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
            >
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <button
            onClick={onClick}
            className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
            aria-label="Change profile image"
          >
            <Camera className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  // ✅ Format phone number nicely for display mode
  const formattedPhone = user?.phoneNumber
    ? new AsYouType().input(user.phoneNumber)
    : 'Not provided';

  return (
    <>
      <Avatar image={userData.profileImage} onClick={onImageClick} />

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* 👤 Name */}
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

          {/* ✉️ Email */}
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

          {/* 📞 Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <ProfilePhoneInput
  value={userData.phoneNumber}
  onChange={(val) =>
    handleUserDataChange({ target: { name: "phoneNumber", value: val } })
  }
/>
            </div>
          </div>

          {/* 🔘 Update Button */}
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition ${
              isUpdatingProfile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUpdatingProfile ? 'Updating...' : 'Update'}
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

          {/* 📞 Beautifully formatted phone number (view only) */}
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Phone number</dt>
            <dd className="mt-1 text-sm text-gray-900">{formattedPhone}</dd>
          </div>
        </dl>
      )}
    </>
  );
}

export default ProfileDetails;
