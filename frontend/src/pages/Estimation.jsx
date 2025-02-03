import { useEffect, useState } from "react";
import { Loader, Hammer } from "lucide-react";

export default function Estimation() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center  bg-white text-gray-900 text-center">
      <Hammer className="w-16 h-16 animate-bounce text-yellow-500" />
      <p className="text-lg mt-2 text-gray-600">We are crafting for you...</p>
      
      <div className="flex items-center mt-4">
        <Loader className="w-10 h-10 animate-spin text-blue-500" />
        <span className="ml-3 text-xl font-medium">Developing{dots}</span>
      </div>
    </div>
  );
}
