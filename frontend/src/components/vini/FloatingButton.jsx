import React from "react";
import Draggable from "react-draggable";

function FloatingButton({ isOpen, setIsOpen }) {
  return (
    <Draggable
      bounds="parent" // keeps button inside the app container
    >
      <div
        className={`fixed bottom-24 right-4 z-50 transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 flex items-center justify-center 
                 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 
                 text-white font-bold shadow-lg hover:shadow-2xl 
                 transform hover:scale-110 transition-all duration-300 relative cursor-grab active:cursor-grabbing"
        >
          <span className="text-sm tracking-wide">VINI</span>
        </button>
      </div>
    </Draggable>
  );
}

export default FloatingButton;
