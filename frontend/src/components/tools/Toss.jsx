import React, { useState, useRef } from "react";

export default function Toss({
  head = "/logo/512.png",
  size = 176,
}) {
  const [rotation, setRotation] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [animDuration, setAnimDuration] = useState(2000);
  const wrapperRef = useRef(null);

  // Manual flip (tap/drag) — NO RESULT
  const flipTap = () => {
    if (isFlipping) return;
    const extra = 180;

    setAnimDuration(400);
    setIsFlipping(true);
    setRotation((r) => r + extra);

    setTimeout(() => {
      // Do NOT set result
      setIsFlipping(false);
    }, );
  };

  // Toss coin — ALWAYS SHOW RESULT
const tossCoin = () => {
  if (isFlipping) return;

  setResult(null);
  setIsFlipping(true);

  const finalIsHeads = Math.random() < 0.5;

  // detect current face by rotation mod 360
  const normalized = ((rotation % 360) + 360) % 360;
  const currentlyHeads = normalized < 90 || normalized > 270;

  // full spins
  const fullTurns = Math.floor(Math.random() * 5) + 6; // 6–10
  let spins = fullTurns * 360;

  // if current face != desired final face, add 180
  if (finalIsHeads !== currentlyHeads) {
    spins += 180;
  }

  // duration
  const dur = 1800;
  setAnimDuration(dur);

  // run rotation
  setRotation((r) => r + spins);

  setTimeout(() => {
    setResult(finalIsHeads ? "heads" : "tails");
    setIsFlipping(false);
  }, dur + 50);
};


  const coinStyle = {
    width: size,
    height: size,
  };

  const innerStyle = {
    transform: `rotateY(${rotation}deg)`,
    transitionProperty: "transform",
    transitionDuration: `${animDuration}ms`,
    transitionTimingFunction: "cubic-bezier(.18,.9,.28,1)",
    transformStyle: "preserve-3d",
  };

  return (
    <div className="w-full flex flex-col items-center mt-8 select-none">
      {/* Coin container */}
      <div
        ref={wrapperRef}
        style={coinStyle}
        className={`relative perspective-1000 cursor-pointer ${
          isFlipping ? "pointer-events-none" : ""
        }`}
        onClick={flipTap}
      >
        {/* Shadow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "0 12px 30px rgba(20,20,30,0.45)" }}
        />

        {/* Coin */}
        <div
          className="relative w-full h-full rounded-full mx-auto"
          style={{
            ...coinStyle,
            WebkitTransformStyle: "preserve-3d",
            transformStyle: "preserve-3d",
          }}
        >
          {/* faces */}
          <div className="absolute inset-0 rounded-full" style={innerStyle}>
            {/* HEAD */}
            <div
              className="absolute inset-0 rounded-full backface-hidden overflow-hidden flex items-center justify-center"
              style={{
                transform: "rotateY(0deg) translateZ(1px)",
                background: "linear-gradient(145deg,#e6d28a,#c9a74f)",
                border: "6px solid rgba(120,90,30,0.9)",
                boxShadow:
                  "inset 0 6px 14px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              <img
                src={head}
                alt="Heads"
                draggable={false}
                className="w-3/4 h-3/4 object-contain rounded-full z-10"
              />
              <div
                className="absolute bottom-4 right-6 z-20 font-black text-[28px]"
                style={{
                  color: "rgba(70,40,0,0.95)",
                  textShadow:
                    "0 1px 0 rgba(255,255,255,0.35), 0 -2px 6px rgba(0,0,0,0.45)",
                }}
              >
                H
              </div>
            </div>

            {/* TAIL */}
            <div
              className="absolute inset-0 rounded-full backface-hidden overflow-hidden flex items-center justify-center"
              style={{
                transform: "rotateY(180deg) translateZ(1px)",
                background: "linear-gradient(160deg,#d3a47a,#8f4a2b)",
                border: "6px solid rgba(70,30,20,0.95)",
                boxShadow:
                  "inset 0 6px 12px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className="text-[64px] font-extrabold leading-none text-white"
                  style={{ WebkitTextStroke: "1px rgba(0,0,0,0.25)" }}
                >
                  T
                </div>
                <div className="text-sm text-white/90 mt-1">TAIL</div>
              </div>
            </div>
          </div>

          {/* Rim */}
          <div
            className="absolute -inset-[6px] rounded-full pointer-events-none"
            style={{
              boxShadow: "inset 0 0 0 6px rgba(0,0,0,0.04)",
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(255,255,255,0.02))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent 65%, black 66%)",
            }}
          />
        </div>
      </div>

      {/* Toss button */}
      <button
        onClick={tossCoin}
        disabled={isFlipping}
        className={`mt-6 px-8 py-2 rounded-full text-white font-semibold shadow-xl ${
          isFlipping
            ? "opacity-50 cursor-not-allowed bg-gray-400"
            : "bg-gradient-to-r from-green-500 to-blue-600 hover:scale-105"
        }`}
      >
        {isFlipping ? "Tossing..." : "Toss a Coin"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`mt-4 px-6 py-2 rounded-2xl text-lg font-bold uppercase shadow-md ${
            result === "heads"
              ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
              : "bg-gradient-to-r from-orange-500 to-red-600 text-white"
          }`}
        >
          {result === "heads" ? "HEAD" : "TAIL"}
        </div>
      )}
    </div>
  );
}
