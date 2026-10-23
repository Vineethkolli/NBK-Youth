import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const GANGAVARAM_CENTER = [15.809177, 80.164013];
export const STREET_COORDINATES = {
  'Panchayat Street': GANGAVARAM_CENTER,
  'Bodrai Street': GANGAVARAM_CENTER,
  'Valeti Street': GANGAVARAM_CENTER,
  'Jagrlamudi Street': GANGAVARAM_CENTER,
  'Shivalayam Street': GANGAVARAM_CENTER,
  Center: GANGAVARAM_CENTER,
  Patimeedha: GANGAVARAM_CENTER,
  'Malluchamma Street': GANGAVARAM_CENTER,
  Others: GANGAVARAM_CENTER
};

const markerIcon = (category, selected = false) => L.divIcon({
  className: 'people-map-marker',
  html: `<span style="background:${category === 'Youth' ? '#f5c542' : '#22a447'};${selected ? 'box-shadow:0 0 0 5px rgba(59,130,246,.35);' : ''}"></span>`,
  iconSize: [24, 32],
  iconAnchor: [12, 31]
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
    }
  });
  return null;
}

export function PeopleMap({ people = [], onSelect, selectedLocation, picker = false }) {
  const selected = selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null;

  return (
    <MapContainer center={selected || GANGAVARAM_CENTER} zoom={19} maxZoom={22} className="h-full w-full">
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Google Hybrid Satellite">
          <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" maxZoom={22} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Satellite Pure">
          <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={22} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Esri World Imagery">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} maxNativeZoom={18} />
        </LayersControl.BaseLayer>
      </LayersControl>
      {picker && <LocationPicker onSelect={onSelect} />}
      {people.map((person) => person.location?.lat && person.location?.lng && (
        <Marker key={person._id || person.pid} position={[person.location.lat, person.location.lng]} icon={markerIcon(person.category)}>
          <Tooltip permanent direction="top" offset={[0, -26]}>{person.name}</Tooltip>
          <Popup><strong>{person.name}</strong><br />{person.category} · {person.street}</Popup>
        </Marker>
      ))}
      {selected && <Marker position={selected} icon={markerIcon('Youth', true)} />}
    </MapContainer>
  );
}

export default PeopleMap;
