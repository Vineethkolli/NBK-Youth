import { useState } from "react";
import { CloudSun, Timer, Coins, CalculatorIcon, FileStack, ImageIcon } from "lucide-react";
import Weather from "../components/tools/Weather";
import Calculator from "../components/tools/Calculator";
import Stopwatch from "../components/tools/Stopwatch";
import Toss from "../components/tools/Toss";
import PdfMergerTool from "../components/tools/PdfMerger";
import ImageToPdfTool from "../components/tools/ImageToPdf";

export default function Tools() {
  const [active, setActive] = useState("weather");

  const tabs = [
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "stopwatch", label: "Timer", icon: Timer },
    { id: "toss", label: "Toss", icon: Coins },
    { id: "pdfmerger", label: "PDF Merger", icon: FileStack },
    { id: "imagetopdf", label: "Image to PDF", icon: ImageIcon },
    { id: "calculator", label: "Calci", icon: CalculatorIcon },
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
      {active === "imagetopdf" && <ImageToPdfTool />}
    </div>
  );
}
