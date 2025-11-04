import React, { useEffect, useState } from "react";

export default function DevelopingPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-transparent overflow-hidden select-none">
      {/* Center Computer */}
      <div className="relative flex flex-col items-center">
        {/* Monitor */}
        <div className="w-72 sm:w-96 h-48 bg-gray-900 border-4 border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gray-800 h-6 flex items-center px-2 space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 p-3 text-green-400 font-mono text-sm">
            <TypingCode />
          </div>
        </div>

        {/* Stand */}
        <div className="w-20 h-2 bg-gray-700 rounded-b-lg"></div>
        <div className="w-28 h-1 bg-gray-600 rounded mt-1"></div>
      </div>
    </div>
  );
}

function TypingCode() {
  const lines = [
    "const NBKYouth = () => {",
    "  console.log('🚀 NBK Youth initializing...');",
    "  console.log('💡 Developing ideas...');",
    "  console.log('⚙️  Building dreams...');",
    "  console.log('🌍 Connecting communities...');",
    "  console.log('🔥 NBK Youth — Always Growing!');",
    "}",
    "",
    "NBKYouth();",
  ];

  const [text, setText] = useState("");

  useEffect(() => {
    let i = 0;
    const full = lines.join("\n");
    const interval = setInterval(() => {
      setText(full.slice(0, i));
      i++;
      if (i > full.length) i = 0; // Loop animation
    }, 55);
    return () => clearInterval(interval);
  }, []);

  return (
    <pre className="whitespace-pre-wrap leading-snug">
      {text}
      <span className="animate-pulse">|</span>
    </pre>
  );
}
