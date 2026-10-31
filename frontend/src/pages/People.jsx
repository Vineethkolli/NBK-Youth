import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Columns, ChevronDown, ChevronRight, Edit2, Filter, MapPinned, Plus, Search, Trash2,
  Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { STREET_COORDINATES } from '../components/people/PeopleMap';
import PeopleMapView from '../components/people/PeopleMapView';
import PeopleStats from '../components/people/PeopleStats';
import PeopleStatsEnglishPrint from '../components/people/PeopleStatsEnglishPrint';
import PeopleStatsTeluguPrint from '../components/people/PeopleStatsTeluguPrint';
import PeopleForm from '../components/people/PeopleForm';
import PeopleEnglishPrint from '../components/people/PeopleEnglishPrint';
import PeopleTeluguPrint from '../components/people/PeopleTeluguPrint';
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

const INITIAL_COLUMNS = {
  pid: true,
  name: true,
  category: true,
  email: false,
  phone: false,
  street: false,
  location: false
};

function People() {
  const { hasAccess } = useAuth();
  const { language } = useLanguage();

  const canViewContactDetails = hasAccess('Privileged');
  const canManagePeople = hasAccess('Pro');

  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    street: ''
  });
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [panel, setPanel] = useState(null);
  const [view, setView] = useState('stats');
  const [statsPeople, setStatsPeople] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const StatsPrintComponent =
    language === 'te'
      ? PeopleStatsTeluguPrint
      : PeopleStatsEnglishPrint;

  const { category, street } = filters;

  const visibleColumns = canViewContactDetails
    ? columns
    : {
        ...columns,
        email: false,
        phone: false
      };

  const fetchPeople = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search,
        category,
        street
      });

      const { data } = await axios.get(
        `${API_URL}/api/people?${params}`
      );

      setPeople(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to fetch people'
      );
    }
  }, [category, search, street]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const fetchStatsPeople = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/people`);
      setStatsPeople(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to fetch people statistics'
      );
    }
  }, []);

  useEffect(() => {
    fetchStatsPeople();
  }, [fetchStatsPeople]);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

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
      fetchStatsPeople();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete person'
      );
    }
  };

  const toggleColumn = (key) => {
    setColumns((previous) => ({
      ...previous,
      [key]: !previous[key]
    }));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditing(null);
    fetchPeople();
    fetchStatsPeople();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <h1 className="text-2xl font-semibold">People</h1>

        <div className="flex space-x-3">
          {[
            ['stats', 'Stats', BarChart3],
            ['people', 'People', Users],
            ['map', 'Map View', MapPinned]
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`flex items-center rounded-md px-2 py-2 font-semibold ${
                view === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon className="mr-1 h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'stats' && (
        <PeopleStats
          people={statsPeople}
          streets={STREETS}
          PrintComponent={StatsPrintComponent}
        />
      )}

      {view === 'people' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by PID, name, email, phone..."
                className="w-full rounded-lg border py-1 pl-10 pr-4"
              />
            </div>

            <div className="flex shrink-0 items-center space-x-3">
              {canManagePeople && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="btn-secondary flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </button>
              )}

              {language === 'te' ? (
                <PeopleTeluguPrint
                  people={people}
                  visibleColumns={visibleColumns}
                />
              ) : (
                <PeopleEnglishPrint
                  people={people}
                  visibleColumns={visibleColumns}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setPanel(panel === 'filters' ? null : 'filters')
              }
              className="flex items-center gap-3 rounded-md border bg-white px-3 py-1 shadow"
            >
              <span className="flex items-center gap-2 font-medium">
                <Filter className="h-4 w-4 text-gray-600" />
                Filters
              </span>

              {panel === 'filters' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setPanel(panel === 'columns' ? null : 'columns')
              }
              className="flex items-center gap-3 rounded-md border bg-white px-3 py-1 shadow"
            >
              <span className="flex items-center gap-2 font-medium">
                <Columns className="h-4 w-4 text-gray-600" />
                Columns
              </span>

              {panel === 'columns' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {panel === 'filters' && (
            <div className="animate-fadeIn rounded-lg border bg-white p-2 shadow">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <select
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      category: event.target.value
                    }))
                  }
                  className="form-select"
                >
                  <option value="">Category</option>
                  <option value="Youth">Youth</option>
                  <option value="Villager">Villager</option>
                </select>

                <select
                  value={filters.street}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      street: event.target.value
                    }))
                  }
                  className="form-select"
                >
                  <option value="">Street</option>
                  {STREETS.map((streetName) => (
                    <option key={streetName} value={streetName}>
                      {streetName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {panel === 'columns' && (
            <div className="animate-fadeIn rounded-lg border bg-white p-2 shadow">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {Object.entries(columns)
                  .filter(
                    ([key]) =>
                      canViewContactDetails ||
                      !['email', 'phone'].includes(key)
                  )
                  .map(([key, visible]) => (
                    <label
                      key={key}
                      className="inline-flex items-center text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => toggleColumn(key)}
                        className="form-checkbox"
                      />

                      <span className="ml-2 capitalize">
                        {key === 'pid' ? 'PID' : key}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      S.No
                    </th>

                    {visibleColumns.pid && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        PID
                      </th>
                    )}

                    {visibleColumns.name && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Name
                      </th>
                    )}

                    {visibleColumns.category && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Category
                      </th>
                    )}

                    {canViewContactDetails && visibleColumns.email && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Email
                      </th>
                    )}

                    {canViewContactDetails && visibleColumns.phone && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Phone
                      </th>
                    )}

                    {visibleColumns.street && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Street
                      </th>
                    )}

                    {visibleColumns.location && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Location
                      </th>
                    )}

                    {canManagePeople && (
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {people.map((person, index) => (
                    <tr key={person._id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {index + 1}
                      </td>

                      {visibleColumns.pid && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.pid}
                        </td>
                      )}

                      {visibleColumns.name && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.name}
                        </td>
                      )}

                      {visibleColumns.category && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.category}
                        </td>
                      )}

                      {canViewContactDetails && visibleColumns.email && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.email || '-'}
                        </td>
                      )}

                      {canViewContactDetails && visibleColumns.phone && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.phone || '-'}
                        </td>
                      )}

                      {visibleColumns.street && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.street}
                        </td>
                      )}

                      {visibleColumns.location && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {person.location
                            ? `${person.location.lat.toFixed(5)}, ${person.location.lng.toFixed(5)}`
                            : '-'}
                        </td>
                      )}

                      {canManagePeople && (
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openEdit(person)}
                              title="Edit"
                              aria-label={`Edit ${person.name}`}
                            >
                              <Edit2 className="h-4 w-4 text-indigo-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(person)}
                              title="Delete"
                              aria-label={`Delete ${person.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {people.length === 0 && (
                <p className="py-4 text-center text-gray-500">
                  No people found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <PeopleForm
          person={editing}
          initialForm={initialForm}
          streets={STREETS}
          streetCoordinates={STREET_COORDINATES}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {view === 'map' && (
        <PeopleMapView
          people={statsPeople}
          streets={STREETS}
          streetCoordinates={STREET_COORDINATES}
        />
      )}
    </div>
  );
}

export default People;
