import { useEffect, useState } from "react";
import { Loader, Hammer, PenTool } from "lucide-react";

export default function Estimation() {
  // Array of messages to cycle through
  const words = ["Designing", "Developing", "Innovating"];
  const [currentWord, setCurrentWord] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Cycle words every 3 seconds
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);

    // Animate dots for a typewriter effect every 500ms
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);

    return () => {
      clearInterval(wordInterval);
      clearInterval(dotsInterval);
    };
  }, [words.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  text-black p-6">
      <div className="flex space-x-6 items-center">
        <Hammer className="w-16 h-16 animate-bounce text-yellow-400" />
        <PenTool className="w-16 h-16 animate-pulse text-pink-400" />
      </div>
      <p className="text-3xl mt-6 font-bold drop-shadow-lg">
        We're {words[currentWord]}{dots}
      </p>
      <div className="flex items-center mt-8">
        <Loader className="w-10 h-10 animate-spin text-blue-800" />
      </div>
    </div>
  );
}
