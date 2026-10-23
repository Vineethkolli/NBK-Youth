/* eslint-disable react/prop-types */
import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import PeopleMap from './PeopleMap';

function PeopleForm({ person, initialForm, streets, streetCoordinates, onClose, onSuccess }) {
  const toLocationObject = (coordinates) => ({ lat: coordinates[0], lng: coordinates[1] });
  const fallbackLocation = toLocationObject(streetCoordinates[person?.street] || streetCoordinates.Others);
  const [form, setForm] = useState(person ? { ...person, location: person.location || fallbackLocation } : initialForm);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleStreet = (street) => {
    setForm((current) => ({ ...current, street, location: toLocationObject(streetCoordinates[street]) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (person?._id) await axios.put(`${API_URL}/api/people/${person._id}`, form);
      else await axios.post(`${API_URL}/api/people`, form);
      toast.success(person ? 'People record updated successfully' : 'People record added successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-md  rounded-lg bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{person ? 'Update People Record' : 'Add New People'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Name *
              <input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-gray-700">Email
              <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-gray-700">Phone
              <input type="tel" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-gray-700">Category *
              <select required value={form.category} onChange={(event) => updateForm('category', event.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"><option>Youth</option><option>Villager</option></select>
            </label>
            <label className="block text-sm font-medium text-gray-700">Street *
              <select required value={form.street} onChange={(event) => handleStreet(event.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{streets.map((street) => <option key={street}>{street}</option>)}</select>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <button type="button" onClick={() => setShowLocationPicker(true)} className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-left text-gray-500 shadow-sm hover:bg-gray-50">Choose on map</button>
              <p className="mt-1 text-xs text-gray-500">{form.location ? `${form.location.lat.toFixed(6)}, ${form.location.lng.toFixed(6)}` : 'Not selected'}</p>
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
              <button disabled={loading} className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Saving...' : person ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      </div>
      {showLocationPicker && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"><div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex shrink-0 items-center justify-between border-b px-4 py-3"><h2 className="text-lg font-semibold">Choose Location</h2><button onClick={() => setShowLocationPicker(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close location map"><X className="h-6 w-6" /></button></div><div className="min-h-0 flex-1"><PeopleMap picker selectedLocation={form.location} onSelect={(location) => { setForm((current) => ({ ...current, location })); setShowLocationPicker(false); }} /></div></div></div>}
    </>
  );
}

export default PeopleForm;
