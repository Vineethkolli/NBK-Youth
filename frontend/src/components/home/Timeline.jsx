import { useState } from 'react';
import { Plus, Trash2, X, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { formatDateTime } from '../../utils/dateTime';

function Timeline({ events, isTimelineEditing, setIsTimelineEditing, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', dateTime: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', dateTime: '' });

  const getEventStatus = (dateTime) => {
    const eventDate = new Date(dateTime);
    const now = new Date();

    if (Number.isNaN(eventDate.getTime())) {
      return 'upcoming';
    }

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (eventDate < startOfToday) {
      return 'completed';
    }

    if (eventDate >= startOfToday && eventDate <= endOfToday) {
      return 'today';
    }

    return 'upcoming';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dateTime = new Date(formData.dateTime).toISOString();

      await axios.post(`${API_URL}/api/homepage/events`, {
        ...formData,
        dateTime,
      });

      toast.success('Event added successfully');
      setShowForm(false);
      setFormData({ name: '', dateTime: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event._id);
    const dateTimeLocal = new Date(event.dateTime).toISOString().slice(0, 16);
    setEditFormData({
      name: event.name,
      dateTime: dateTimeLocal,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dateTime = new Date(editFormData.dateTime).toISOString();

      await axios.put(`${API_URL}/api/homepage/events/${editingId}`, {
        ...editFormData,
        dateTime,
      });

      toast.success('Event updated successfully');
      setEditingId(null);
      setEditFormData({ name: '', dateTime: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/api/homepage/events/${id}`);
      toast.success('Event deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Event Timeline</h2>
        <div className="flex gap-2">
  {isTimelineEditing && (
    <button
      onClick={() => setShowForm(true)}
      className="inline-flex items-center px-1.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
    >
      <Plus className="h-4 w-4 mr-1" />
      Add Event
    </button>
  )}

  <button
    onClick={() => setIsTimelineEditing(!isTimelineEditing)}
    className="inline-flex items-center px-1.5 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
  >
    <Edit2 className="h-4 w-4 mr-1" />
    {isTimelineEditing ? 'Done' : 'Edit'}
  </button>
</div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Event
              </h3>

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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateTime: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Event
              </h3>

              <button
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Name
                </label>

                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      name: e.target.value,
                    })
                  }
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
                  value={editFormData.dateTime}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      dateTime: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No events scheduled
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            {events.map((event) => {
              const status = getEventStatus(event.dateTime);

              const dotColor =
                status === 'completed'
                  ? 'bg-green-500'
                  : status === 'today'
                  ? 'bg-blue-600'
                  : 'bg-gray-400';

              return (
                <div
                  key={event._id}
                  className="relative pl-8 pb-8"
                >
<div
  className={`absolute left-2 top-2 w-4 h-4 rounded-full border-4 border-white ${
    status === 'completed'
      ? 'bg-green-500'
      : status === 'today'
      ? 'bg-blue-600 shadow-md'
      : 'bg-gray-500'
  }`}
>
  {status === 'today' && (
    <span className="absolute -inset-0.5 rounded-full border-2 border-blue-300 animate-ping" />
  )}
</div>

                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {event.name}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {formatDateTime(event.dateTime)}
                        </p>
                      </div>

                      {isTimelineEditing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(event)}
                            disabled={editingId !== null || deletingId === event._id}
                            className="text-blue-600 hover:text-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event._id)}
                            disabled={deletingId === event._id || editingId !== null}
                            className={`text-red-600 hover:text-red-800 transition ${
                              deletingId === event._id
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            {deletingId === event._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Timeline;
