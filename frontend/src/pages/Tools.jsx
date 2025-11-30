import { useState } from "react";
import { CloudSun, Timer, Coins, CalculatorIcon } from "lucide-react";
import Weather from "../components/tools/Weather";
import Calculator from "../components/tools/Calculator";

export default function Tools() {
  const [active, setActive] = useState("weather");

  const tabs = [
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "calculator", label: "Calculator", icon: CalculatorIcon },
    { id: "stopwatch", label: "Stopwatch", icon: Timer },
    { id: "toss", label: "Toss", icon: Coins },
  ];

  return (
    <div className="min-h-screen  text-slate-900">

      <div className="flex gap-3 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const activeTab = active === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-2 py-2 rounded-xl border 
                ${activeTab ? "bg-slate-900 text-white" : "bg-white"}`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Selected Tool */}
      {active === "weather" && <Weather />}
      {active === "calculator" && <Calculator />}
      {active === "stopwatch" && <Stopwatch />}
      {active === "toss" && <Toss />}
    </div>
  );
}
