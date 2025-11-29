// FULL UPDATED CODE (UI Optimized for Mobile)

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
  Sunrise,
  Sunset,
  Thermometer,
  Eye,
  Gauge,
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

/* WEATHER LABELS (English only) */
const weatherCodeToLabel = (code) => {
  const labelKeys = {
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
  return labelKeys[code] || "Weather";
};

const msToKmH = (ms) => (ms == null ? null : +(ms * 3.6).toFixed(1));
const maybeRound = (v, d = 0) =>
  v == null ? "—" : (Math.round(v * 10 ** d) / 10 ** d).toString();

/* WIND DIRECTION */
const getWindDirection = (degrees) => {
  if (degrees == null) return "—";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

/* CALCULATE FEELS LIKE */
const calculateFeelsLike = (temp, windSpeed, humidity) => {
  if (temp == null) return temp;

  // Simple wind chill / heat index approximation
  if (temp < 10 && windSpeed > 4.8) {
    const windKmH = windSpeed * 3.6;
    return (
      13.12 +
      0.6215 * temp -
      11.37 * Math.pow(windKmH, 0.16) +
      0.3965 * temp * Math.pow(windKmH, 0.16)
    );
  } else if (temp > 27 && humidity > 40) {
    const rh = humidity;
    const t = temp;
    return (
      -8.78469475556 +
      1.61139411 * t +
      2.33854883889 * rh -
      0.14611605 * t * rh -
      0.012308094 * t * t -
      0.0164248277778 * rh * rh
    );
  }
  return temp;
};

export default function Weather() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  const FETCHING_TEXT = "Fetching weather…";
  const ERROR_TEXT = "Unable to load weather";

  /* FETCH WEATHER */
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&hourly=weathercode,temperature_2m,precipitation_probability,relative_humidity_2m,windspeed_10m,cloudcover,visibility,pressure_msl,dewpoint_2m,uv_index,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

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
  }, []);

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
      rainPct: d.precipitation_probability_max?.[i] ?? d.precipitation_probability_max,
      rainMM: d.precipitation_sum[i],
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
    }));
  }, [weather]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white text-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
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

  const current = weather.current_weather || {};
  const idx = findClosestHourIndex(weather.hourly);

  const currHumidity = weather.hourly?.relative_humidity_2m?.[idx];
  const currPrecipPct = weather.hourly?.precipitation_probability?.[idx];
  const currCloud = weather.hourly?.cloudcover?.[idx];
  const currVisibility = weather.hourly?.visibility?.[idx];
  const currPressure = weather.hourly?.pressure_msl?.[idx];
  const currDewPoint = weather.hourly?.dewpoint_2m?.[idx];
  const currUVIndex = weather.hourly?.uv_index?.[idx];
  const currApparentTemp = weather.hourly?.apparent_temperature?.[idx];
  const windKmH = msToKmH(current.windspeed);
  const windDir = getWindDirection(current.winddirection);
  const feelsLike =
    currApparentTemp ??
    calculateFeelsLike(current.temperature, current.windspeed, currHumidity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-slate-900 p-2 sm:p-4 pb-10">

      <div className="max-w-6xl mx-auto">

        {/* TOP CARD */}
        <div className="bg-white/90 rounded-3xl shadow-xl p-4 sm:p-6 space-y-5 border border-white/50">

          {/* TOP AREA — MOBILE IMPROVED */}
          <div className="flex flex-wrap items-center sm:items-start gap-3 sm:gap-6">

            {/* ICON */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 text-white shadow-md">
              {weatherCodeToIcon(current.weathercode, {
                className: "w-10 h-10 sm:w-14 sm:h-14 drop-shadow-lg",
              })}
            </div>

            {/* MAIN TEMPS */}
            <div className="flex-1 min-w-[200px]">

              {/* LOCATION */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Gangavaram
                </h1>
                <span className="text-xs sm:text-base text-slate-600">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* TEMP + DETAILS */}
              <div className="flex flex-wrap gap-5">

                <div>
                  <p className="text-4xl sm:text-6xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent notranslate">
                    {current.temperature != null ? Math.round(current.temperature) : "—"}°C
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {weatherCodeToLabel(current.weathercode)}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-xs sm:text-base">

                  <div className="flex items-center gap-1 sm:gap-2 text-slate-700 notranslate">
                    <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Feels like: <b>{feelsLike != null ? Math.round(feelsLike) + "°C" : "—"}</b></span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 text-slate-700 notranslate">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Humidity: <b>{currHumidity ?? "—"}%</b></span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 text-slate-700 notranslate">
                    <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Wind: <b>{windKmH ?? "—"} km/h {windDir}</b></span>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* TODAY STATS (wraps better on small screens) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">

            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <div className="text-xs text-red-600 font-semibold uppercase">High</div>
              <div className="text-xl sm:text-2xl font-bold text-red-700 mt-1 notranslate">
                {dailyList[0]?.max != null ? Math.round(dailyList[0].max) + "°" : "—"}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <div className="text-xs text-blue-600 font-semibold uppercase">Low</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1 notranslate">
                {dailyList[0]?.min != null ? Math.round(dailyList[0].min) + "°" : "—"}
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
              <div className="text-xs text-sky-600 font-semibold uppercase">Rain</div>
              <div className="text-base sm:text-lg font-bold text-sky-700 mt-1 flex justify-center items-center gap-1 notranslate">
                <Droplets className="w-4 h-4" />
                {dailyList[0]?.rainPct ?? "—"}%
                <span className="text-slate-500 text-xs">/</span>
                {dailyList[0]?.rainMM ?? "—"}mm
              </div>
            </div>

          </div>

          {/* SMALL METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">

            {[
              {
                icon: <Droplets className="w-5 h-5 text-blue-500" />,
                label: "Precipitation",
                value: `${currPrecipPct ?? "—"}%`
              },
              {
                icon: <Cloud className="w-5 h-5 text-slate-500" />,
                label: "Cloud",
                value: `${currCloud ?? "—"}%`
              },
              {
                icon: <Eye className="w-5 h-5 text-purple-500" />,
                label: "Visibility",
                value: currVisibility ? `${(currVisibility / 1000).toFixed(1)} km` : "—"
              },
              {
                icon: <Gauge className="w-5 h-5 text-indigo-500" />,
                label: "Pressure",
                value: currPressure ? `${currPressure} hPa` : "—"
              },
              {
                icon: <Droplets className="w-5 h-5 text-cyan-500" />,
                label: "Dew Point",
                value: currDewPoint ? `${Math.round(currDewPoint)}°C` : "—"
              },
              {
                icon: <Sun className="w-5 h-5 text-yellow-500" />,
                label: "UV Index",
                value: currUVIndex != null ? maybeRound(currUVIndex, 1) : "—"
              },
              {
                icon: <Sunrise className="w-5 h-5 text-orange-500" />,
                label: "Sunrise",
                value: dailyList[0]?.sunrise
                  ? new Date(dailyList[0].sunrise).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                  : "—"
              },
              {
                icon: <Sunset className="w-5 h-5 text-indigo-500" />,
                label: "Sunset",
                value: dailyList[0]?.sunset
                  ? new Date(dailyList[0].sunset).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                  : "—"
              }
            ].map(({ icon, label, value }, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white/70 border border-slate-200 rounded-xl p-3 shadow-sm"
              >
                {icon}
                <div>
                  <div className="text-slate-600 text-xs font-medium">{label}</div>
                  <div className="font-bold text-slate-800 notranslate">{value}</div>
                </div>
              </div>
            ))}

          </div>

        </div>

        {/* ============ HOURLY SCROLLER (improved mobile spacing) ============ */}
        <h2 className="mt-6 mb-2 text-lg sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          Next 24 hours
        </h2>

        <div className="overflow-x-auto pb-3 -mx-2 px-2">
          <div className="flex gap-2 sm:gap-3 min-w-max">

            {hourlyWindow.map((h, i) => (
              <div
                key={i}
                className={`w-24 sm:w-32 bg-white/80 rounded-xl p-3 text-center shadow-md border transition-all ${
                  i === 0
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-200"
                }`}
              >
                <div className="text-xs sm:text-sm text-slate-600 mb-1">
                  {new Date(h.time).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    hour12: true,
                  })}
                </div>

                <div className="my-2">
                  {weatherCodeToIcon(h.code, {
                    className: "w-7 h-7 sm:w-9 sm:h-9 mx-auto"
                  })}
                </div>

                <div className="text-lg sm:text-xl font-bold text-slate-800 notranslate">
                  {h.temp != null ? Math.round(h.temp) + "°" : "—"}
                </div>

                <div className="text-[10px] sm:text-xs flex justify-center items-center gap-1 bg-sky-50 rounded-full px-2 py-1 mt-2 notranslate">
                  <Droplets className="w-3 h-3 text-sky-600" />
                  {h.rain ?? "—"}%
                </div>

              </div>
            ))}

          </div>
        </div>


        {/* ============ DAILY ============ */}
        <h2 className="mt-8 mb-3 text-lg sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          Next 7 days
        </h2>

        <div className="space-y-2 sm:space-y-4">
          {dailyList.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between bg-white/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-md border ${
                i === 0
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-5 flex-1">

                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-slate-100 rounded-xl shadow-sm">
                  {weatherCodeToIcon(d.code, { className: "w-7 h-7 sm:w-9 sm:h-9" })}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-lg text-slate-800 truncate">
                    {new Date(d.time).toLocaleDateString("en-IN", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <div className="text-[11px] sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                    <span>{weatherCodeToLabel(d.code)}</span>

                    <span className="flex items-center gap-1 notranslate">
                      <Droplets className="w-3 h-3 sm:w-4 sm:h-4 text-sky-600" />
                      {d.rainPct ?? "—"}%
                    </span>

                    <span className="text-slate-400">/</span>

                    <span className="notranslate">{d.rainMM ?? "—"}mm</span>
                  </div>
                </div>

              </div>

              <div className="text-right ml-2">
                <div className="font-bold text-lg sm:text-2xl text-red-600 notranslate">
                  {d.max != null ? Math.round(d.max) + "°" : "—"}
                </div>
                <div className="text-base sm:text-lg text-blue-600 font-semibold notranslate">
                  {d.min != null ? Math.round(d.min) + "°" : "—"}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
