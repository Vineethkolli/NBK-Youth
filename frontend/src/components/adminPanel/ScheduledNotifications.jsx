import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Edit2, Send, Plus, X } from 'lucide-react';
import { API_URL } from '../../utils/config';

function ScheduledNotifications() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scheduledAt: '',
    frequency: 'ONCE',
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetch = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/scheduled-notifications`);
      setItems(res.data);
    } catch {
      toast.error('Failed to fetch scheduled notifications');
    }
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setFormData({ title: '', message: '', scheduledAt: '', frequency: 'ONCE' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { title, message, scheduledAt, frequency } = formData;
    if (!title.trim() || !message.trim() || !scheduledAt || !frequency) {
      toast.error('Please fill all mandatory fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        frequency,
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/scheduled-notifications/${editingId}`, payload);
        toast.success('Updated successfully');
      } else {
        await axios.post(`${API_URL}/api/scheduled-notifications`, payload);
        toast.success('Scheduled successfully');
      }

      resetForm();
      setShowForm(false);
      setShowActions(false);
      fetch();
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      message: item.message,
      scheduledAt: new Date(item.scheduledAt).toISOString().slice(0, 10),
      frequency: item.frequency || 'ONCE',
    });
    setShowForm(true);
    setShowActions(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled item?')) return;
    try {
      await axios.delete(`${API_URL}/api/scheduled-notifications/${id}`);
      toast.success('Deleted successfully');
      fetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSendNow = async (id) => {
    if (!confirm('Are you sure you want to send this notification now?')) return;
    try {
      await axios.post(`${API_URL}/api/scheduled-notifications/${id}/send`);
      toast.success('Sent successfully');
      fetch();
    } catch {
      toast.error('Failed to send');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
        <h2 className="text-2xl font-semibold">Scheduled Notifications</h2>
          <p className="text-sm text-gray-600 mb-2">
    Notifications will be sent automatically at 7 AM of scheduled date
  </p> </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setShowForm(true); setShowActions(false); }}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </button>
          {items.length > 0 && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-grey-700"
            >
              <Edit2 className="h-4 w-4 mr-2" /> {showActions ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Scheduled Notification' : 'Add Scheduled Notification'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); setShowActions(false); }} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule (Date) *</label>
                <input
                  type="date"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency *</label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="ONCE">Only this time</option>
                  <option value="YEARLY">Every year</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); setShowActions(false); }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="mt-4 space-y-2">
        {items.map((it) => (
          <div key={it._id} className="flex items-center justify-between border p-3 rounded">
            <div>
              <div className="font-medium">Title: {it.title}</div>
              <div className="font-medium">Message: {it.message}</div>
              <div className="text-xs text-gray-500">Frequency: {it.frequency === 'YEARLY' ? 'Yearly' : 'Once'}</div>
              <div className="text-xs text-gray-500">Scheduled: {new Date(it.scheduledAt).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">
                Status: {it.sendHistory && it.sendHistory.length ? `Sent (${it.sendHistory.map(s => new Date(s.sentAt).toLocaleDateString()).join(', ')})` : 'Not Sent'}
              </div>
            </div>
            {showActions && (
              <div className="flex items-center gap-2">
                <button title="Send Now" onClick={() => handleSendNow(it._id)} className="p-2 bg-green-100 rounded hover:bg-green-200"><Send className="h-4 w-4" /></button>
                <button title="Edit" onClick={() => handleEdit(it)} className="p-2 bg-blue-100 rounded hover:bg-blue-200"><Edit2 className="h-4 w-4" /></button>
                <button title="Delete" onClick={() => handleDelete(it._id)} className="p-2 bg-red-100 bg-red-200"><Trash2 className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduledNotifications;
