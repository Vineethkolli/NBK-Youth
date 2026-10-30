import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, Circle, useMap, useMapEvents } from 'react-leaflet';
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

const currentLocationIcon = (heading = 0) => L.divIcon({
  className: 'people-map-current-location',
  html: `<span class="people-map-direction-cone" style="transform:rotate(${heading}deg)"></span><span class="people-map-location-dot"></span>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

function AnimatedCurrentLocation({ location }) {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const previousPositionRef = useRef(null);

  useEffect(() => {
    const target = L.latLng(location.lat, location.lng);
    const previous = previousPositionRef.current || target;
    const startedAt = performance.now();
    const duration = previous.equals(target) ? 0 : 650;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const animate = (now) => {
      const progress = duration === 0 ? 1 : Math.min((now - startedAt) / duration, 1);
      const eased = 1 - ((1 - progress) ** 3);
      const position = L.latLng(
        previous.lat + ((target.lat - previous.lat) * eased),
        previous.lng + ((target.lng - previous.lng) * eased)
      );
      markerRef.current?.setLatLng(position);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousPositionRef.current = target;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [location.lat, location.lng]);

  useEffect(() => () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={Math.max(location.accuracy || 0, 3)}
        pathOptions={{
          color: '#2563eb',
          fillColor: '#60a5fa',
          fillOpacity: 0.18,
          weight: 1
        }}
      />
      <Marker
        ref={markerRef}
        position={[location.lat, location.lng]}
        icon={currentLocationIcon(location.heading)}
      >
        <Popup>You are here</Popup>
      </Marker>
    </>
  );
}

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

function MapRotation({ heading, enabled }) {
  const map = useMap();

  useEffect(() => {
    const mapPane = map.getPane('mapPane');
    if (!mapPane) return undefined;
    mapPane.style.transformOrigin = '50% 50%';
    mapPane.style.transition = enabled ? 'rotate 0.35s ease-out' : 'none';
    mapPane.style.rotate = enabled ? `${-heading}deg` : 'none';

    return () => {
      mapPane.style.rotate = 'none';
      mapPane.style.transition = '';
    };
  }, [enabled, heading, map]);

  return null;
}

function CurrentLocationControl({ onLocationFound, onHeadingChange, isLocating, setIsLocating }) {
  const map = useMap();
  const watchIdRef = useRef(null);
  const hasLocatedRef = useRef(false);
  const lastLocationRef = useRef(null);
  const headingRef = useRef(0);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    hasLocatedRef.current = false;
    lastLocationRef.current = null;
    headingRef.current = 0;
    onHeadingChange(0);
    setIsLocating(false);
  }, [onHeadingChange, setIsLocating]);

  useEffect(() => stopTracking, [stopTracking]);

  useEffect(() => {
    if (!isLocating) return undefined;

    const handleOrientation = (event) => {
      const nextHeading = Number.isFinite(event.webkitCompassHeading)
        ? event.webkitCompassHeading
        : Number.isFinite(event.alpha) ? 360 - event.alpha : null;
      if (nextHeading !== null) {
        headingRef.current = nextHeading;
        onHeadingChange(nextHeading);
        if (lastLocationRef.current) {
          onLocationFound({ ...lastLocationRef.current, heading: nextHeading });
        }
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isLocating, onHeadingChange, onLocationFound]);

  const handleLocate = async (event) => {
    event.stopPropagation();
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          toast.error('Device orientation permission was denied');
        }
      } catch {
        toast.error('Unable to access device orientation');
      }
    }

    if (isLocating) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const location = {
            lat: Number(coords.latitude.toFixed(6)),
            lng: Number(coords.longitude.toFixed(6)),
            accuracy: coords.accuracy,
            heading: Number.isFinite(coords.heading) ? coords.heading : headingRef.current
          };
          lastLocationRef.current = location;
          map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 18), {
            animate: true,
            duration: 0.6
          });
          onLocationFound(location);
        },
        () => toast.error('Unable to determine your precise location'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return;
    }

    setIsLocating(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const location = {
          lat: Number(coords.latitude.toFixed(6)),
          lng: Number(coords.longitude.toFixed(6)),
          accuracy: coords.accuracy,
          heading: Number.isFinite(coords.heading) ? coords.heading : headingRef.current
        };
        lastLocationRef.current = location;
        const nextPosition = [location.lat, location.lng];
        if (hasLocatedRef.current) {
          map.panTo(nextPosition, { animate: true, duration: 0.6, easeLinearity: 0.25 });
        } else {
          map.flyTo(nextPosition, Math.max(map.getZoom(), 18));
          hasLocatedRef.current = true;
        }
        onLocationFound(location);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied'
          : 'Unable to determine your location';
        toast.error(message);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="leaflet-control rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-md hover:bg-gray-50"
      aria-label="Show my precise location"
      title="Show my precise location"
    >
      <Navigation className={`h-5 w-5 ${isLocating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export function PeopleMap({ people = [], onSelect, selectedLocation, picker = false, center = GANGAVARAM_CENTER }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
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
      <MapRotation heading={mapHeading} enabled={isLocating} />
      <div className="people-map-location-control">
        <CurrentLocationControl
          onLocationFound={setCurrentLocation}
          onHeadingChange={setMapHeading}
          isLocating={isLocating}
          setIsLocating={setIsLocating}
        />
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
      {currentLocation && <AnimatedCurrentLocation location={currentLocation} />}
    </MapContainer>
  );
}

export default PeopleMap;
