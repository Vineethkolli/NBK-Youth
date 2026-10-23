import { useCallback, useEffect, useMemo, useState } from 'react';
import { Columns, ChevronDown, ChevronRight, Edit2, Filter, MapPinned, Plus, Search, Trash2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import PeopleMap, { STREET_COORDINATES } from '../components/people/PeopleMap';
import PeopleForm from '../components/people/PeopleForm';
import PeopleEnglishPrint from '../components/people/PeopleEnglishPrint';
import PeopleTeluguPrint from '../components/people/PeopleTeluguPrint';
import PeopleMapPrint from '../components/people/PeopleMapPrint';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const STREETS = Object.keys(STREET_COORDINATES);
const toLocationObject = (coordinates) => ({
  lat: coordinates[0],
  lng: coordinates[1]
});
const initialForm = {
  name: '',
  email: '',
  phone: '',
  category: 'Youth',
  street: STREETS[0],
  location: toLocationObject(STREET_COORDINATES[STREETS[0]])
};

function People() {
  const { hasAccess } = useAuth();
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', street: '' });
  const [columns, setColumns] = useState({ pid: true, name: true, category: true, email: false, phone: false, street: false, location: false });
  const [panel, setPanel] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapFilters, setMapFilters] = useState({ category: '', street: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { language } = useLanguage();
  const { category, street } = filters;

  const fetchPeople = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, category, street });
      const { data } = await axios.get(`${API_URL}/api/people?${params}`);
      setPeople(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch people');
    }
  }, [category, search, street]);
  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const mapPeople = useMemo(() => people.filter((person) => person.location?.lat && person.location?.lng), [people]);
  const filteredMapPeople = useMemo(() => mapPeople.filter((person) =>
    (!mapFilters.category || person.category === mapFilters.category) &&
    (!mapFilters.street || person.street === mapFilters.street)
  ), [mapFilters, mapPeople]);
  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (person) => {
    setEditing(person);
    setShowForm(true);
  };
  const handleDelete = async (person) => {
    if (!window.confirm(`Delete ${person.name}?`)) return;
    try {
      await axios.delete(`${API_URL}/api/people/${person._id}`);
      toast.success('People record deleted');
      fetchPeople();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete person'); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
        <div className="flex items-center space-x-3">
          {hasAccess('Pro') && <button onClick={openAdd} className="btn-secondary flex items-center"><Plus className="mr-1 h-4 w-4" />Add</button>}
          {language === 'te'
            ? <PeopleTeluguPrint people={people} visibleColumns={columns} />
            : <PeopleEnglishPrint people={people} visibleColumns={columns} />}
        </div>
      </div>
      </div>

      <div className="space-y-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by PID, name, email, phone..." className="w-full rounded-lg border py-1 pl-10 pr-4" /></div>
        <div className="flex items-center gap-4">
            <button onClick={() => setPanel(panel === 'filters' ? null : 'filters')} className="flex items-center gap-3 rounded-md border bg-white px-3 py-1 shadow">
              <span className="flex items-center gap-2 font-medium"><Filter className="h-4 w-4 text-gray-600" />Filters</span>
              {panel === 'filters' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <button onClick={() => setPanel(panel === 'columns' ? null : 'columns')} className="flex items-center gap-3 rounded-md border bg-white px-3 py-1 shadow">
              <span className="flex items-center gap-2 font-medium"><Columns className="h-4 w-4 text-gray-600" />Columns</span>
              {panel === 'columns' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <button onClick={() => setShowMap(true)} className="btn-secondary ml-auto flex items-center"><MapPinned className="mr-1 h-4 w-4" />Map View</button>
        </div>
        {panel === 'filters' && <div className="animate-fadeIn rounded-lg border bg-white p-2 shadow"><div className="flex flex-wrap items-center gap-3 sm:gap-4"><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className="form-select"><option value="">Category</option><option>Youth</option><option>Villager</option></select><select value={filters.street} onChange={(event) => setFilters({ ...filters, street: event.target.value })} className="form-select"><option value="">Street</option>{STREETS.map((street) => <option key={street}>{street}</option>)}</select></div></div>}
        {panel === 'columns' && <div className="animate-fadeIn rounded-lg border bg-white p-2 shadow"><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{Object.entries(columns).map(([key, visible]) => <label key={key} className="inline-flex items-center text-sm"><input type="checkbox" checked={visible} onChange={() => setColumns({ ...columns, [key]: !visible })} className="form-checkbox" /><span className="ml-2 capitalize">{key === 'pid' ? 'PID' : key}</span></label>)}</div></div>}
      </div>

      <div className="rounded-lg bg-white shadow"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">S.No</th>{columns.pid && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">PID</th>}{columns.name && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>}{columns.category && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>}{columns.email && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>}{columns.phone && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>}{columns.street && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Street</th>}{columns.location && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Location</th>}{hasAccess('Pro') && <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>}</tr></thead><tbody className="divide-y divide-gray-200">{people.map((person, index) => <tr key={person._id}><td className="whitespace-nowrap px-6 py-4 text-sm">{index + 1}</td>{columns.pid && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.pid}</td>}{columns.name && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.name}</td>}{columns.category && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.category}</td>}{columns.email && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.email || '-'}</td>}{columns.phone && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.phone || '-'}</td>}{columns.street && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.street}</td>}{columns.location && <td className="whitespace-nowrap px-6 py-4 text-sm">{person.location ? `${person.location.lat.toFixed(5)}, ${person.location.lng.toFixed(5)}` : '-'}</td>}{hasAccess('Pro') && <td className="flex gap-3 px-6 py-4"><button onClick={() => openEdit(person)} title="Edit"><Edit2 className="h-4 w-4 text-indigo-600" /></button><button onClick={() => handleDelete(person)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button></td>}</tr>)}</tbody></table>{people.length === 0 && <p className="py-4 text-center text-gray-500">No people found</p>}</div></div>

      {showForm && <PeopleForm person={editing} initialForm={initialForm} streets={STREETS} streetCoordinates={STREET_COORDINATES} onClose={() => { setShowForm(false); setEditing(null); }} onSuccess={() => { setShowForm(false); setEditing(null); fetchPeople(); }} />}
      {showMap && <div className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-8"><div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-white"><div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3"><div className="flex items-center gap-3"><h2 className="text-lg font-semibold">People Map</h2><select value={mapFilters.category} onChange={(event) => setMapFilters({ ...mapFilters, category: event.target.value })} className="rounded-md border p-1 text-sm"><option value="">Category</option><option>Youth</option><option>Villager</option></select><select value={mapFilters.street} onChange={(event) => setMapFilters({ ...mapFilters, street: event.target.value })} className="rounded-md border p-1 text-sm"><option value="">Street</option>{STREETS.map((mapStreet) => <option key={mapStreet}>{mapStreet}</option>)}</select><PeopleMapPrint people={filteredMapPeople} /></div><button onClick={() => setShowMap(false)} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900" aria-label="Close map"><X className="h-6 w-6" /></button></div><div className="min-h-0 flex-1"><PeopleMap people={filteredMapPeople} /></div></div></div>}
    </div>
  );
}

export default People;
