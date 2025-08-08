import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function EventLabelManager() {
  const [eventLabel, setEventLabel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ label: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEventLabel();
  }, []);

  const fetchEventLabel = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/event-label`);
      setEventLabel(data);
    } catch (error) {
      console.error('Failed to fetch event label:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      toast.error('Please enter an event label');
      return;
    }

    setIsSubmitting(true);
    try {
      if (eventLabel) {
        // Update existing
        await axios.put(`${API_URL}/api/event-label/${eventLabel._id}`, formData);
        toast.success('Event label updated successfully');
      } else {
        // Create new
        await axios.post(`${API_URL}/api/event-label`, formData);
        toast.success('Event label created successfully');
      }
      
      setShowForm(false);
      setIsEditing(false);
      setFormData({ label: '' });
      fetchEventLabel();
    } catch (error) {
      toast.error('Failed to save event label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setFormData({ label: eventLabel.label });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event label?')) return;

    try {
      await axios.delete(`${API_URL}/api/event-label/${eventLabel._id}`);
      toast.success('Event label deleted successfully');
      setEventLabel(null);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to delete event label');
    }
  };

  const handleAdd = () => {
    setFormData({ label: '' });
    setIsEditing(false);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Event Label
        </h2>
        <div className="flex items-center space-x-2">
          {eventLabel ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </button>
              {isEditing && (
                <button
                  onClick={handleDelete}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </button>
          )}
        </div>
      </div>

      {eventLabel && !showForm && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-medium text-gray-900">{eventLabel.label}</p>
          <p className="text-sm text-gray-500 mt-1">
            Created on {new Date(eventLabel.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {!eventLabel && !showForm && (
        <div className="text-center text-gray-500 py-8">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No event label set</p>
          <p className="text-sm">Add an event label to describe the current batch of records</p>
        </div>
      )}

      {showForm && (
        <div className="border rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Label
              </label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData({ label: e.target.value })}
                placeholder="e.g., Sankranti 2024, Ganesh Chaturthi 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  setFormData({ label: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Saving...' : (eventLabel ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default EventLabelManager;