import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';

function Committee() {
  const { user } = useAuth();
  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  const [members, setMembers] = useState([]);
  const [localMembers, setLocalMembers] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [registerId, setRegisterId] = useState('');

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => { setLocalMembers([...members]); setHasChanges(false); }, [members]);

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/committee`);
      setMembers(data);
    } catch {
      toast.error('Failed to fetch committee members');
    }
  };

  const onDragEnd = result => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const updated = Array.from(localMembers);
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);
    setLocalMembers(updated);
    setHasChanges(true);
  };

  const moveMember = (from, to) => {
    if (to < 0 || to >= localMembers.length) return;
    const updated = Array.from(localMembers);
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setLocalMembers(updated);
    setHasChanges(true);
  };

  const saveOrder = async () => {
    const ordered = localMembers.map((m, i) => ({ ...m, order: i + 1 }));
    try {
      await axios.put(`${API_URL}/api/committee/order`, {
        members: ordered.map(m => ({ _id: m._id, order: m.order })),
      });
      setMembers(ordered);
      setIsReorderMode(false);
      setHasChanges(false);
      toast.success('Order updated');
    } catch {
      toast.error('Failed to update order');
      setLocalMembers([...members]);
      setHasChanges(false);
    }
  };

  const cancelReorder = () => {
    setLocalMembers([...members]);
    setIsReorderMode(false);
    setHasChanges(false);
  };

  const handleAddMember = async e => {
    e.preventDefault();
    if (!registerId.trim()) return toast.error('Enter a register ID');
    try {
      await axios.post(`${API_URL}/api/committee`, { registerId });
      toast.success('Member added');
      setShowAddDialog(false);
      setRegisterId('');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemove = async id => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await axios.delete(`${API_URL}/api/committee/${id}`);
      toast.success('Member removed');
      fetchMembers();
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Committee</h1>
        {isPrivilegedUser && (
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowAddDialog(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" /> Add
            </button>
            
            <div className="relative">
  <button
    onClick={() => {
      setIsReorderMode(true);
      setIsEditMode(false);
    }}
    className={`btn-secondary w-full ${isReorderMode ? 'opacity-50 pointer-events-none' : ''}`}
    disabled={showAddDialog}
  >
    <GripHorizontal className="h-4 w-4 mr-2" /> Reorder
  </button>
  </div>
  <button
              onClick={() => { setIsEditMode(!isEditMode); setIsReorderMode(false); }}
              className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
              disabled={showAddDialog}
            >
              <Edit2 className="h-4 w-4 mr-2" /> {isEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {isReorderMode && (
  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col items-center space-y-3">
    <p className="text-indigo-800 text-sm text-center">
     <GripHorizontal className="h-4 w-4 inline mb-1" /> Drag or use arrows to change order of members.
    </p>
    <div className="flex justify-center space-x-4">
      <button
        onClick={cancelReorder}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={saveOrder}
        disabled={!hasChanges}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50 transition"
      >
        Save
      </button>
    </div>
  </div>
)}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="committee-droppable">
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {localMembers.map((m, idx) => (
                <Draggable
                  key={m._id}
                  draggableId={m._id}
                  index={idx}
                  isDragDisabled={!isReorderMode}
                >
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform ${
                        isReorderMode ? 'cursor-move hover:scale-[1.03]' : 'hover:shadow-lg'
                      } ${snapshot.isDragging ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                      <div className="relative">
                        {(isReorderMode) && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10">
                            {idx + 1}
                          </div>
                        )}
                        {m.profileImage ? (
                          <img src={m.profileImage} alt={m.name} className="w-full h-48 object-cover" />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-400">{m.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {isEditMode && (
  <button
    onClick={() => handleRemove(m._id)}
    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}
                      </div>

                      <div className="p-2">
                        <h3 className="text-center font-semibold text-lg">{m.name}</h3>
                      </div>

                      {isReorderMode && (
                        <div className="p-3 bg-gray-50 border-t flex justify-center items-center space-x-4">
                          <div {...dragProvided.dragHandleProps} className="flex items-center">
                            <GripHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                          </div>
                          <div className="flex space-x-1">
                            <button onClick={() => moveMember(idx, idx - 1)} disabled={idx === 0} className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors">
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => moveMember(idx, idx + 1)} disabled={idx === localMembers.length - 1} className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors">
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Committee Member</h2>
              <button onClick={() => setShowAddDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Register ID</label>
                <input type="text" required value={registerId} onChange={e => setRegisterId(e.target.value)} placeholder="Enter register ID (e.g., R1)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                <p className="text-xs text-gray-500 mt-1">The member's name and profile image will be automatically fetched.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddDialog(false)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <p className="text-sm text-gray-600 text-center mt-6">
          Name and Image are fetched from your profile </p>

    </div>
  );
}

export default Committee;
