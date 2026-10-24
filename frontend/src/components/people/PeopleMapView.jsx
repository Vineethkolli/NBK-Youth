import { useMemo, useRef, useState } from 'react';
import PeopleMap, { GANGAVARAM_CENTER } from './PeopleMap';
import PeopleMapPrint from './PeopleMapPrint';

function PeopleMapView({ people, streets, streetCoordinates }) {
  const [mapFilters, setMapFilters] = useState({ category: '', street: '' });
  const [mapSearch, setMapSearch] = useState('');
  const mapElementRef = useRef(null);

  const mapPeople = useMemo(
    () => people.filter((person) => person.location?.lat && person.location?.lng),
    [people]
  );
  const filteredMapPeople = useMemo(() => mapPeople.filter((person) =>
    (!mapFilters.category || person.category === mapFilters.category) &&
    (!mapFilters.street || person.street === mapFilters.street)
  ), [mapFilters, mapPeople]);
  const searchableMapPeople = useMemo(() => {
    const query = mapSearch.trim().toLowerCase();
    if (!query) return filteredMapPeople;
    return filteredMapPeople.filter((person) =>
      [person.name, person.street].some((value) => value?.toLowerCase().includes(query))
    );
  }, [filteredMapPeople, mapSearch]);
  const mapCenter = useMemo(() => {
    if (mapFilters.street && streetCoordinates[mapFilters.street]) {
      return streetCoordinates[mapFilters.street];
    }

    const query = mapSearch.trim().toLowerCase();
    if (query && searchableMapPeople[0]?.location) {
      return [searchableMapPeople[0].location.lat, searchableMapPeople[0].location.lng];
    }

    const matchingStreet = streets.find((street) => street.toLowerCase().includes(query));
    return streetCoordinates[matchingStreet] || GANGAVARAM_CENTER;
  }, [mapFilters.street, mapSearch, searchableMapPeople, streetCoordinates, streets]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 shadow">
        <select value={mapFilters.category} onChange={(event) => setMapFilters({ ...mapFilters, category: event.target.value })} className="rounded-md border p-1 text-sm">
          <option value="">Category</option>
          <option>Youth</option>
          <option>Villager</option>
        </select>
        <select value={mapFilters.street} onChange={(event) => setMapFilters({ ...mapFilters, street: event.target.value })} className="rounded-md border p-1 text-sm">
          <option value="">Street</option>
          {streets.map((street) => <option key={street}>{street}</option>)}
        </select>
        <PeopleMapPrint people={filteredMapPeople} onSearchChange={setMapSearch} mapElementRef={mapElementRef} />
      </div>
      <div
  ref={mapElementRef}
  translate="no"
  className="notranslate h-[calc(100vh-14rem)] min-h-[32rem] overflow-hidden rounded-lg bg-white shadow"
>
  <PeopleMap people={searchableMapPeople} center={mapCenter} />
</div>
    </section>
  );
}

export default PeopleMapView;
