import { Eye, EyeOff } from 'lucide-react';

function PasswordChangeForm({
  passwordData,
  showPasswords,
  togglePasswordVisibility,
  handlePasswordChange,
  handleSubmit,
  isUpdatingPassword
}) {
  return (
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
        disabled={isUpdatingPassword}
        className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
          isUpdatingPassword ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

export default PasswordChangeForm;
