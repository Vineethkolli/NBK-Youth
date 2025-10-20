
function FloatingButton({ isOpen, setIsOpen }) {
  return (
    <div
      className={`fixed bottom-24 right-2 z-50 transition-all duration-300 ${
        isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center 
               rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 
               text-white font-bold shadow-lg hover:shadow-2xl 
               transform hover:scale-110 transition-all duration-300 relative"
      >
        <span className="text-sm tracking-wide">VINI</span>
      </button>
    </div>
  );
}

export default FloatingButton;
