import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { X } from 'lucide-react';
import { API_URL } from '../../utils/config';

export default function UpdateUserForm({ user, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.patch(`${API_URL}/api/users/${user._id}`, formData);
      toast.success('User updated successfully');
      onUpdated(data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Update User Profile</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone Number *</label>
            <input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
