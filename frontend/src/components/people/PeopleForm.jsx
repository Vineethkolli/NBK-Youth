import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import PeopleMap from './PeopleMap';

function PeopleForm({
  person,
  initialForm,
  streets,
  streetCoordinates,
  onClose,
  onSuccess,
}) {
  const toLocationObject = (coordinates) => ({
    lat: coordinates[0],
    lng: coordinates[1],
  });

  const fallbackLocation = toLocationObject(
    streetCoordinates[person?.street] || streetCoordinates.Others
  );

  const [form, setForm] = useState(
    person
      ? { ...person, location: person.location || fallbackLocation }
      : initialForm
  );

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleStreet = (street) => {
    const coordinates = streetCoordinates[street] || streetCoordinates.Others;

    setForm((current) => ({
      ...current,
      street,
      location: coordinates ? toLocationObject(coordinates) : current.location,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (person?._id) {
        await axios.put(`${API_URL}/api/people/${person._id}`, form);
        toast.success('People record updated successfully');
      } else {
        await axios.post(`${API_URL}/api/people`, form);
        toast.success('People record added successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {person ? 'Update People' : 'Add New People'}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name || ''}
                onChange={(event) => updateForm('name', event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(event) => updateForm('email', event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(event) => updateForm('phone', event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                required
                value={form.category || ''}
                onChange={(event) =>
                  updateForm('category', event.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Youth">Youth</option>
                <option value="Villager">Villager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street *
              </label>
              <select
                required
                value={form.street || ''}
                onChange={(event) => handleStreet(event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {streets.map((street) => (
                  <option key={street} value={street}>
                    {street}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>

              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-1 text-left text-gray-500 shadow-sm hover:bg-gray-50"
              >
                Choose on map
              </button>

              <p className="mt-1 text-xs text-gray-500">
                {form.location &&
                Number.isFinite(form.location.lat) &&
                Number.isFinite(form.location.lng)
                  ? `${form.location.lat.toFixed(6)}, ${form.location.lng.toFixed(6)}`
                  : 'Not selected'}
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
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
                {isSubmitting
                  ? person
                    ? 'Updating...'
                    : 'Adding...'
                  : person
                    ? 'Update'
                    : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showLocationPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Choose Location</h2>

              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close location map"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <PeopleMap
                picker
                selectedLocation={form.location}
                onSelect={(location) => {
                  setForm((current) => ({ ...current, location }));
                  setShowLocationPicker(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PeopleForm;
