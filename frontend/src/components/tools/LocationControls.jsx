import { useState, useEffect, useRef } from "react";
import { Search, Navigation } from "lucide-react";

export default function LocationControls({ onLocationChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SEARCH API
  const searchLocation = async (value) => {
    setQuery(value);
    if (value.length < 3) return setResults([]);

    const url = `https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    setResults(data);
  };

  const handleSelect = (loc) => {
    setQuery(loc.display_name);
    setResults([]);
    onLocationChange({
      name: loc.display_name,
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12&addressdetails=1`;

        fetch(url)
          .then((r) => r.json())
          .then((data) => {
            const displayName = data?.display_name || "Location";
            onLocationChange({
              name: displayName,
              lat: latitude,
              lon: longitude,
            });
            setIsGettingLocation(false);
          })
          .catch(() => {
            onLocationChange({
              name: "Location",
              lat: latitude,
              lon: longitude,
            });
            setIsGettingLocation(false);
          });
      },
      () => {
        alert("Unable to get location");
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className="mb-4">
      <div className="flex flex-row items-center gap-3 w-full">

        <div ref={searchRef} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

          <input
            type="text"
            value={query}
            onChange={(e) => searchLocation(e.target.value)}
            placeholder="Search by Location..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />

          {results.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white w-full border rounded-xl shadow-lg z-50">
              {results.map((loc, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(loc)}
                  className="p-2 cursor-pointer hover:bg-indigo-100"
                >
                  {loc.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg px-3 py-2 shadow-md disabled:opacity-50"
        >
          <Navigation className={`w-5 h-5 ${isGettingLocation ? "animate-pulse" : ""}`} />
          <span className="font-medium whitespace-nowrap">
            {isGettingLocation ? "Getting..." : "Location"}
          </span>
        </button>

      </div>
    </div>
  );
}
