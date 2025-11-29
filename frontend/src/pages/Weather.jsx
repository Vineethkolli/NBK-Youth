import { useEffect, useMemo, useState } from "react";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  CloudFog,
  Moon,
  Sunrise,
  Sunset,
  Thermometer,
} from "lucide-react";

// Fixed village coordinates
const LAT = 15.8091769;
const LON = 80.1640130;

/* ICON MAP */
const weatherCodeToIcon = (code, props = {}) => {
  if (code === 0) return <Sun {...props} />;
  if (code === 1 || code === 2) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if (code === 45 || code === 48) return <CloudFog {...props} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle {...props} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain {...props} />;
  if (code >= 71 && code <= 77) return <CloudSnow {...props} />;
  if (code === 95 || code === 96 || code === 99)
    return <CloudLightning {...props} />;

  return <Cloud {...props} />;
};

/* WEATHER LABELS */
const weatherCodeToLabel = (code) => {
  const labels = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Moderate rain showers",
    82: "Heavy rain showers",
    85: "Light snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Severe thunderstorm",
  };
  return labels[code] || "Weather";
};

const msToKmH = (ms) => (ms == null ? null : +(ms * 3.6).toFixed(1));
const maybeRound = (v, d = 0) =>
  v == null ? "—" : (Math.round(v * 10 ** d) / 10 ** d).toString();

export default function Weather() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  /* FETCH WEATHER */
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&hourly=weathercode,temperature_2m,precipitation_probability,relative_humidity_2m,windspeed_10m,cloudcover&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=auto`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setWeather(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load weather");
        setLoading(false);
      });
  }, []);

  /* HOURLY INDEX */
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

  /* NEXT 24 HOURS */
  const hourlyWindow = useMemo(() => {
    if (!weather?.hourly) return [];
    const h = weather.hourly;
    const start = findClosestHourIndex(h);
    const end = Math.min(start + 24, h.time.length);

    return h.time.slice(start, end).map((t, i) => ({
      time: t,
      code: h.weathercode[start + i],
      temp: h.temperature_2m[start + i],
      rain: h.precipitation_probability[start + i],
    }));
  }, [weather]);

  /* DAILY */
  const dailyList = useMemo(() => {
    if (!weather?.daily) return [];
    const d = weather.daily;
    return d.time.map((t, i) => ({
      time: t,
      code: d.weathercode[i],
      min: d.temperature_2m_min[i],
      max: d.temperature_2m_max[i],
      rainPct: d.precipitation_probability_max[i],
      rainMM: d.precipitation_sum[i],
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
    }));
  }, [weather]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-300 text-white text-xl">
        Fetching weather…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-300 text-white">
        {error}
      </div>
    );

  /* CURRENT WEATHER */
  const current = weather.current_weather;
  const idx = findClosestHourIndex(weather.hourly);

  const currHumidity = weather.hourly.relative_humidity_2m[idx];
  const currPrecipPct = weather.hourly.precipitation_probability[idx];
  const currCloud = weather.hourly.cloudcover[idx];
  const windKmH = msToKmH(current.windspeed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 text-slate-900 p-4 pb-10">
      <div className="max-w-4xl mx-auto">

        {/* ===================== TOP CARD ===================== */}
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 space-y-5">

          {/* TOP: Location + Icon + Temp */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              {weatherCodeToIcon(current.weathercode, {
                className: "w-10 h-10 sm:w-12 sm:h-12",
              })}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">Gangavaram</h1>
                <span className="text-sm text-slate-600">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-1">
                <div>
                  <p className="text-4xl sm:text-5xl font-bold">
                    {Math.round(current.temperature)}°C
                  </p>
                  <p className="text-sm text-slate-600">
                    {weatherCodeToLabel(current.weathercode)}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Thermometer className="w-4 h-4" />
                    <span>Feels like: <b>{Math.round(current.temperature)}°C</b></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Droplets className="w-4 h-4" />
                    <span>Humidity: <b>{currHumidity}%</b></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Wind className="w-4 h-4" />
                    <span>Wind: <b>{windKmH} km/h</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============ TODAY STATS (Mobile-friendly) ============ */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">

            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 uppercase">High</div>
              <div className="text-lg font-bold">
                {Math.round(dailyList[0].max)}°
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 uppercase">Low</div>
              <div className="text-lg font-bold">
                {Math.round(dailyList[0].min)}°
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 uppercase">Rain</div>
              <div className="text-lg font-bold flex justify-center items-center gap-1">
                <Droplets className="w-4 h-4 text-sky-600" />
                {dailyList[0].rainPct}% • {dailyList[0].rainMM}mm
              </div>
            </div>
          </div>

          {/* SMALL METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2">

            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
              <Droplets className="w-4 h-4" />
              <div>
                <div className="text-xs text-slate-600">Precip</div>
                <div className="font-semibold">{currPrecipPct}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
              <Cloud className="w-4 h-4" />
              <div>
                <div className="text-xs text-slate-600">Cloud</div>
                <div className="font-semibold">{currCloud}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
              <Sunrise className="w-4 h-4" />
              <div>
                <div className="text-xs text-slate-600">Sunrise</div>
                <div className="font-semibold">
                  {new Date(dailyList[0].sunrise).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
              <Sunset className="w-4 h-4" />
              <div>
                <div className="text-xs text-slate-600">Sunset</div>
                <div className="font-semibold">
                  {new Date(dailyList[0].sunset).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== HOURLY ===================== */}
        <h2 className="mt-8 text-xl font-semibold">Next 24 hours</h2>

        <div className="overflow-x-auto mt-3 pb-3">
          <div className="flex gap-3 min-w-max">
            {hourlyWindow.map((h, i) => (
              <div
                key={i}
                className={`w-24 sm:w-28 bg-white rounded-xl p-3 shadow text-center ${
                  i === 0 ? "ring-2 ring-indigo-200" : ""
                }`}
              >
                <div className="text-xs text-slate-600">
                  {new Date(h.time).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    hour12: true,
                  })}
                </div>

                <div className="my-2">
                  {weatherCodeToIcon(h.code, {
                    className: "w-6 h-6 mx-auto",
                  })}
                </div>

                <div className="text-lg font-semibold">
                  {Math.round(h.temp)}°
                </div>

                <div className="text-xs text-slate-600 mt-1 flex justify-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-600" />
                  {h.rain}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===================== 7 DAY FORECAST ===================== */}
        <h2 className="mt-8 text-xl font-semibold">Next 7 days</h2>

        <div className="mt-3 space-y-3">
          {dailyList.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white rounded-xl p-3 shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl">
                  {weatherCodeToIcon(d.code, { className: "w-7 h-7" })}
                </div>

                <div>
                  <div className="font-medium">
                    {new Date(d.time).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <div className="text-xs text-slate-600">
                    {weatherCodeToLabel(d.code)} •{" "}
                    <Droplets className="inline w-3 h-3 text-sky-600" />{" "}
                    {d.rainPct}% • {d.rainMM}mm
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-lg">{Math.round(d.max)}°</div>
                <div className="text-slate-600">{Math.round(d.min)}°</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
