import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

export const GANGAVARAM_CENTER = [15.809177, 80.164013];
export const STREET_COORDINATES = {
  'Panchayat Street': GANGAVARAM_CENTER,
  'Bodrai Street': [15.808610, 80.164417],
  'Library Street': [15.809312, 80.164720],
  'Jagrlamudi Street': [15.809572, 80.165037],
  'Shivalayam Street': [15.809002, 80.165010],
  Center: [15.808349, 80.164433],
  Patimeedha: [15.807454, 80.163664],
  'Malluchamma Street': [15.807201, 80.164490],
  Others: GANGAVARAM_CENTER
};

const markerIcon = (category, selected = false) => L.divIcon({
  className: 'people-map-marker',
  html: `<span style="background:${category === 'Youth' ? '#f5c542' : '#22a447'};${selected ? 'box-shadow:0 0 0 5px rgba(59,130,246,.35);' : ''}"></span>`,
  iconSize: [24, 32],
  iconAnchor: [12, 31]
});

const currentLocationIcon = L.divIcon({
  className: 'people-map-current-location',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
    }
  });
  return null;
}

function MapCenterSync({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);

  return null;
}

function CurrentLocationControl({ onLocationFound, isLocating, setIsLocating }) {
  const map = useMap();

  const handleLocate = (event) => {
    event.stopPropagation();
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = {
          lat: Number(coords.latitude.toFixed(6)),
          lng: Number(coords.longitude.toFixed(6))
        };
        map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 18));
        onLocationFound(location);
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied'
          : 'Unable to determine your location';
        toast.error(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={isLocating}
      className="leaflet-control rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-md hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
      aria-label="Show my location"
      title="Show my location"
    >
      <Navigation className={`h-5 w-5 ${isLocating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export function PeopleMap({ people = [], onSelect, selectedLocation, picker = false, center = GANGAVARAM_CENTER }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const selected = selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null;

  return (
    <MapContainer
  center={selected || center}
  zoom={19}
  maxZoom={22}
  translate="no"
  className="notranslate h-full w-full"
>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Google Hybrid Satellite">
          <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" crossOrigin="anonymous" maxZoom={22} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Satellite Pure">
          <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" crossOrigin="anonymous" maxZoom={22} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Esri World Imagery">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" crossOrigin="anonymous" maxZoom={22} maxNativeZoom={18} />
        </LayersControl.BaseLayer>
      </LayersControl>
      {!selected && <MapCenterSync center={center} />}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control">
          <CurrentLocationControl
            onLocationFound={setCurrentLocation}
            isLocating={isLocating}
            setIsLocating={setIsLocating}
          />
        </div>
      </div>
      {picker && <LocationPicker onSelect={onSelect} />}
      {people.map((person) => person.location?.lat && person.location?.lng && (
        <Marker key={person._id || person.pid} position={[person.location.lat, person.location.lng]} icon={markerIcon(person.category)}>
          <Tooltip permanent direction="top" offset={[0, -26]}>{person.name}</Tooltip>
         <Popup>
  <strong>{person.name}</strong>
  <br />
  <span className="text-sm text-gray-600">
    {person.category} · {person.street}
  </span>
  <br />
  {Number.isFinite(Number(person.location?.lat)) &&
    Number.isFinite(Number(person.location?.lng)) && (
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${person.location.lat},${person.location.lng}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        title="Navigate with Google Maps"
        className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <Navigation className="h-4 w-4" />
        <span className="ml-1 text-sm">Navigate</span>
      </a>
    )}
</Popup>
        </Marker>
      ))}
      {selected && <Marker position={selected} icon={markerIcon('Youth', true)} />}
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default PeopleMap;
