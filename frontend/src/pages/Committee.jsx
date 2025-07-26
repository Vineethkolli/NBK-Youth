import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, GripHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';

function Committee() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [registerId, setRegisterId] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/committee`);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to fetch committee members');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!registerId.trim()) {
      toast.error('Please enter a register ID');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/committee`, { registerId });
      toast.success('Committee member added successfully');
      setShowAddDialog(false);
      setRegisterId('');
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add committee member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the committee?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/committee/${memberId}`);
      toast.success('Committee member removed successfully');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove committee member');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newMembers = [...members];
      const draggedMember = newMembers[draggedItem];

      newMembers.splice(draggedItem, 1);
      newMembers.splice(dragOverItem, 0, draggedMember);

      const updatedMembers = newMembers.map((member, idx) => ({
        ...member,
        order: idx + 1,
      }));

      setMembers(updatedMembers);

      try {
        await axios.put(`${API_URL}/api/committee/order`, {
          members: updatedMembers.map(m => ({ _id: m._id, order: m.order })),
        });
        toast.success('Committee order updated successfully');
      } catch (error) {
        toast.error('Failed to update order');
        fetchMembers();
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleDragEnd();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Committee</h1>
        {isPrivilegedUser && (
          <div className="space-x-2">
            <button onClick={() => setShowAddDialog(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditMode ? 'Done Editing' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Edit Mode:</strong> Drag the card or use the grip handle below each card to reorder members.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {members.map((member, index) => (
          <div
            key={member._id}
            draggable={isEditMode}
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={e => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${
              isEditMode ? 'cursor-move hover:shadow-lg transform hover:scale-105' : 'hover:shadow-lg'
            } ${dragOverItem === index ? 'ring-2 ring-indigo-500' : ''}`}
          >
            <div className="relative">
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-4xl font-bold text-gray-400">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {isEditMode && isPrivilegedUser && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-2">
              <h3 className="font-semibold text-lg text-center">{member.name}</h3>
            </div>

            {isEditMode && isPrivilegedUser && (
              <div
                draggable={true}
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-center py-0 cursor-move ${
                  dragOverItem === index ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <GripHorizontal className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Committee Member</h2>
              <button onClick={() => setShowAddDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Register ID
                </label>
                <input
                  type="text"
                  required
                  value={registerId}
                  onChange={e => setRegisterId(e.target.value)}
                  placeholder="Enter register ID (e.g., R1)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The member's name and profile image will be automatically fetched from their profile.
               </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Committee;
