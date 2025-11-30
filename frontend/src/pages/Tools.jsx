import { useState } from "react";
import { CloudSun, Timer, Coins, CalculatorIcon, FileStack } from "lucide-react";
import Weather from "../components/tools/Weather";
import Calculator from "../components/tools/Calculator";
import Stopwatch from "../components/tools/Stopwatch";
import Toss from "../components/tools/Toss";
import PdfMergerTool from "../components/tools/PdfMerger";

export default function Tools() {
  const [active, setActive] = useState("weather");

  const tabs = [
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "stopwatch", label: "Timer", icon: Timer },
    { id: "toss", label: "Toss", icon: Coins },
    { id: "calculator", label: "Calculator", icon: CalculatorIcon },
    { id: "pdfmerger", label: "PDF Merger", icon: FileStack },
  ];

  return (
    <div className="min-h-screen text-slate-900">

      <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const activeTab = active === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap
                ${activeTab ? "bg-slate-900 text-white" : "bg-white"}`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {active === "weather" && <Weather />}
      {active === "stopwatch" && <Stopwatch />}
      {active === "toss" && <Toss />}
      {active === "calculator" && <Calculator />}
      {active === "pdfmerger" && <PdfMergerTool />}
    </div>
  );
}
