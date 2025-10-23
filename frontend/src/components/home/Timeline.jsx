import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { formatDateTime } from '../../utils/dateTime';

function Timeline({ events, isEditing, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dateTime: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert local datetime to ISO string for backend
      const dateTime = new Date(formData.dateTime).toISOString();
      await axios.post(`${API_URL}/api/homepage/events`, {
        ...formData,
        dateTime
      });
      toast.success('Event added successfully');
      setShowForm(false);
      setFormData({ name: '', dateTime: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add event');
    }
  };

const handleDelete = async (id) => {
  const confirm = window.confirm('Are you sure you want to delete this event?');
  if (!confirm) return; 

  try {
    await axios.delete(`${API_URL}/api/homepage/events/${id}`);
    toast.success('Event deleted successfully');
    onUpdate();
  } catch (error) {
    toast.error('Failed to delete event');
  }
};


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Event Timeline</h2>
        {isEditing && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </button>
        )}
      </div>
{showForm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date & Time
          </label>
          <input
            type="datetime-local"
            required
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events scheduled</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            {events.map((event) => (
              <div key={event._id} className="relative pl-8 pb-8">
                <div className="absolute left-2 top-2 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white" />
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(event.dateTime)}
                      </p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Timeline;