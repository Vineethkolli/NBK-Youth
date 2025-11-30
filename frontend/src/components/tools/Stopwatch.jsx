import { useEffect, useRef, useState } from "react";
import { Clock, Timer as TimerIcon } from "lucide-react";

export default function ClockTools() {
  const [tab, setTab] = useState("stopwatch");

  return (
    <div className="w-full max-w-md mx-auto p-4 select-none">

      {/* Tabs */}
      <div className="flex justify-center mb-6 bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setTab("stopwatch")}
          className={`flex-1 py-2 rounded-full text-center transition ${
            tab === "stopwatch"
              ? "bg-white shadow font-semibold"
              : "text-gray-500"
          }`}
        >
          Stopwatch
        </button>

        <button
          onClick={() => setTab("timer")}
          className={`flex-1 py-2 rounded-full text-center transition ${
            tab === "timer" ? "bg-white shadow font-semibold" : "text-gray-500"
          }`}
        >
          Timer
        </button>
      </div>

      {tab === "stopwatch" ? <Stopwatch /> : <Timer />}
    </div>
  );
}

/* ----------------------------------------------------------
   SAMSUNG STYLE STOPWATCH
----------------------------------------------------------- */
function Stopwatch() {
  const [time, setTime] = useState(0); // ms
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  // Start / pause stopwatch
  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setTime((t) => t + 10);
      }, 10);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setTime(0);
    setLaps([]);
    setRunning(false);
  };

  const addLap = () => {
    if (time === 0) return;
    setLaps([{ id: laps.length + 1, t: time }, ...laps]);
  };

  const format = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const ms2 = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(
      2,
      "0"
    )}.${String(ms2).padStart(2, "0")}`;
  };

  return (
    <div>
      {/* Circular Dial */}
      <div className="w-64 h-64 mx-auto rounded-full border-8 border-gray-200 flex items-center justify-center relative">
        

        <div className="text-4xl font-mono">{format(time)}</div>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={toggle}
          className={`px-5 py-2 rounded-full text-white text-lg shadow-md ${
            running ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          onClick={running ? addLap : reset}
          className="px-5 py-2 rounded-full bg-gray-300 text-gray-700 text-lg shadow"
        >
          {running ? "Lap" : "Reset"}
        </button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="mt-6 bg-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto">
          {laps.map((lap) => (
            <div
              key={lap.id}
              className="flex justify-between border-b py-2 text-lg font-mono"
            >
              <span>Lap {lap.id}</span>
              <span>{format(lap.t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   SAMSUNG STYLE TIMER
----------------------------------------------------------- */
function Timer() {
  const [input, setInput] = useState({ h: 0, m: 0, s: 0 });
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  const totalMs = input.h * 3600000 + input.m * 60000 + input.s * 1000;

  const start = () => {
    if (totalMs <= 0) return;
    setLeft(totalMs);
    setRunning(true);
    ref.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 100) {
          clearInterval(ref.current);
          setRunning(false);
          return 0;
        }
        return v - 100;
      });
    }, 100);
  };

  const stop = () => {
    setRunning(false);
    clearInterval(ref.current);
  };

  const reset = () => {
    stop();
    setLeft(0);
  };

  const format = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center">

      {/* Circular Timer UI */}
      <div className="w-64 h-64 rounded-full border-8 border-gray-200 flex items-center justify-center relative">

        <div className="text-3xl font-mono">
          {left > 0 ? format(left) : format(totalMs)}
        </div>
      </div>

      {/* Input Controls */}
      {!running && (
        <div className="mt-5 flex gap-3">
          {["h", "m", "s"].map((k) => (
            <div key={k} className="flex flex-col items-center">
              <input
                type="number"
                className="w-16 text-center p-2 rounded bg-gray-100 text-xl"
                min="0"
                value={input[k]}
                onChange={(e) =>
                  setInput({ ...input, [k]: Number(e.target.value) })
                }
              />
              <span className="text-sm mt-1 uppercase">{k}</span>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        {!running ? (
          <button
            onClick={start}
            className="px-5 py-2 rounded-full bg-green-600 text-white text-lg shadow"
          >
            Start
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-5 py-2 rounded-full bg-red-500 text-white text-lg shadow"
          >
            Pause
          </button>
        )}

        <button
          onClick={reset}
          className="px-5 py-2 rounded-full bg-gray-300 text-gray-700 text-lg shadow"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
