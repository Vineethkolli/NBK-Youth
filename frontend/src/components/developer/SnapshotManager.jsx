import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Database, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

const EVENT_OPTIONS = ['Sankranti', 'Ganesh Chaturthi'];
const COLLECTION_OPTIONS = ['Income', 'Expense', 'Stats', 'Event'];

function SnapshotManager() {
  const [snapshots, setSnapshots] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    customEventName: '',
    year: new Date().getFullYear(),
    selectedCollections: []
  });
  const [editFormData, setEditFormData] = useState({
    eventName: '',
    customEventName: '',
    year: new Date().getFullYear()
  });

  // Delete modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [snapshotToDelete, setSnapshotToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/snapshots`);
      setSnapshots(data);
    } catch (error) {
      toast.error('Failed to fetch snapshots');
    }
  };

  const handleCollectionToggle = (collection) => {
    setFormData(prev => ({
      ...prev,
      selectedCollections: prev.selectedCollections.includes(collection)
        ? prev.selectedCollections.filter(c => c !== collection)
        : [...prev.selectedCollections, collection]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedCollections.length === 0) {
      toast.error('Please select at least one collection');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalEventName = formData.eventName === 'Other' ? formData.customEventName : formData.eventName;
      await axios.post(`${API_URL}/api/snapshots`, {
        eventName: finalEventName,
        year: formData.year,
        selectedCollections: formData.selectedCollections
      });
      toast.success('Snapshot created successfully');
      setShowAddForm(false);
      resetForm();
      fetchSnapshots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create snapshot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (snapshot) => {
    setEditingSnapshot(snapshot);
    setEditFormData({
      eventName: EVENT_OPTIONS.includes(snapshot.eventName) ? snapshot.eventName : 'Other',
      customEventName: EVENT_OPTIONS.includes(snapshot.eventName) ? '' : snapshot.eventName,
      year: snapshot.year
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalEventName = editFormData.eventName === 'Other' ? editFormData.customEventName : editFormData.eventName;
      await axios.put(`${API_URL}/api/snapshots/${editingSnapshot._id}`, {
        eventName: finalEventName,
        year: editFormData.year
      });
      toast.success('Snapshot updated successfully');
      setShowEditForm(false);
      setEditingSnapshot(null);
      fetchSnapshots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update snapshot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (snapshot) => {
    setSnapshotToDelete(snapshot);
    setDeleteConfirmStep(1);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/snapshots/${snapshotToDelete._id}`);
      toast.success('Snapshot deleted successfully');
      fetchSnapshots();
      closeDeleteModal();
    } catch (error) {
      toast.error('Failed to delete snapshot');
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setDeleteConfirmStep(1);
    setSnapshotToDelete(null);
    setIsDeleting(false);
  };

  const resetForm = () => {
    setFormData({
      eventName: '',
      customEventName: '',
      year: new Date().getFullYear(),
      selectedCollections: []
    });
  };

  const getCollectionSummary = (collections) => {
    const summary = [];
    Object.entries(collections).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        summary.push(`${key}: ${value.length}`);
      }
    });
    return summary.join(', ') || 'No data';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Snapshots
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center px-4 py-2 rounded-md ${
              isEditMode ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Snapshots List */}
      <div className="space-y-4">
        {snapshots.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No snapshots created yet</p>
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-lg">{snapshot.eventName}</h3>
                    <span className="font-medium text-lg">{snapshot.year}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Collections: {getCollectionSummary(snapshot.collections)}
                  </p>
                </div>
                
                {isEditMode && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(snapshot)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(snapshot)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Create Snapshot</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name *</label>
                <select
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Event</option>
                  {EVENT_OPTIONS.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.eventName === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom Event Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customEventName}
                    onChange={(e) => setFormData({ ...formData, customEventName: e.target.value })}
                    placeholder="Enter event name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Year *</label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Collections *</label>
                <div className="space-y-2">
                  {COLLECTION_OPTIONS.map(collection => (
                    <label key={collection} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.selectedCollections.includes(collection)}
                        onChange={() => handleCollectionToggle(collection)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{collection}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingSnapshot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Snapshot</h3>
              <button onClick={() => setShowEditForm(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name *</label>
                <select
                  required
                  value={editFormData.eventName}
                  onChange={(e) => setEditFormData({ ...editFormData, eventName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Event</option>
                  {EVENT_OPTIONS.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {editFormData.eventName === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom Event Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.customEventName}
                    onChange={(e) => setEditFormData({ ...editFormData, customEventName: e.target.value })}
                    placeholder="Enter event name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Year *</label>
                <select
                  required
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalVisible && snapshotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-90">
            <h3 className="text-lg font-medium mb-4">
              {deleteConfirmStep === 1
                ? `Are you sure you want to delete snapshot "${snapshotToDelete.eventName} ${snapshotToDelete.year}"?`
                : 'Are you sure? This action is irreversible.'}
            </h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteConfirm}
                className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                {isDeleting ? 'Deleting...' : deleteConfirmStep === 1 ? 'Yes, Continue' : 'Confirm'}
              </button>
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapshotManager;