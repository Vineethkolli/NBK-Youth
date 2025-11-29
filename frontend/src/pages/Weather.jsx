import { useEffect, useMemo, useState } from "react";
import { Cloud } from "lucide-react";
import LocationControls from "../components/weather/LocationControls";
import WeatherDisplay from "../components/weather/WeatherDisplay";

// Default location - Gangavaram
const DEFAULT_LOCATION = {
  name: "Gangavaram",
  lat: 15.809177,
  lon: 80.164013,
};

export default function Weather() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  const FETCHING_TEXT = "Fetching weather…";
  const ERROR_TEXT = "Unable to load weather";

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&hourly=weathercode,temperature_2m,precipitation_probability,relative_humidity_2m,windspeed_10m,cloudcover,visibility,pressure_msl,dewpoint_2m,uv_index,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setWeather(d);
        setLoading(false);
      })
      .catch(() => {
        setError(ERROR_TEXT);
        setLoading(false);
      });
  }, [location]);

  const findClosestHourIndex = (hourly) => {
    if (!hourly) return 0;
    const times = hourly.time.map((t) => new Date(t).getTime());
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const nowMs = now.getTime();
    const exact = times.indexOf(nowMs);
    if (exact !== -1) return exact;
    const future = times.findIndex((t) => t > nowMs);
    return future !== -1 ? future : times.length - 1;
  };

  const currentIndex = findClosestHourIndex(weather?.hourly);

  // Next 24 Hours
  const hourlyWindow = useMemo(() => {
    if (!weather?.hourly) return [];
    const h = weather.hourly;
    const start = currentIndex;
    const end = Math.min(start + 24, h.time.length);

    return h.time.slice(start, end).map((t, i) => ({
      time: t,
      code: h.weathercode[start + i],
      temp: h.temperature_2m[start + i],
      rain: h.precipitation_probability[start + i],
    }));
  }, [weather, currentIndex]);

  // Daily
  const dailyList = useMemo(() => {
    if (!weather?.daily) return [];
    const d = weather.daily;
    return d.time.map((t, i) => ({
      time: t,
      code: d.weathercode[i],
      min: d.temperature_2m_min[i],
      max: d.temperature_2m_max[i],
      rainPct: d.precipitation_probability_max?.[i] ?? d.precipitation_probability_max,
      rainMM: d.precipitation_sum[i],
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
    }));
  }, [weather]);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mx-auto mb-4"></div>
          <p>{FETCHING_TEXT}</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 text-white">
        <div className="text-center">
          <Cloud className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen text-slate-900 p-2 sm:p-4 pb-10">
      <div className="max-w-6xl mx-auto">
        <LocationControls 
          onLocationChange={handleLocationChange}
          currentLocation={location}
        />
        
        {weather && (
          <WeatherDisplay
            weather={weather}
            locationName={location.name}
            hourlyWindow={hourlyWindow}
            dailyList={dailyList}
            currentIndex={currentIndex}
          />
        )}
      </div>
    </div>
  );
}
