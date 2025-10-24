import { useEffect, useState } from 'react';

const BUTTON_SIZE_PX = 44;

function FloatingButton({ isOpen, setIsOpen }) {

  const initialPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate initial X (left position): windowWidth - rightOffset - buttonWidth
    const rightOffset = 12;
    const initialX = windowWidth - rightOffset - BUTTON_SIZE_PX;

    // Calculate initial Y (top position): windowHeight - bottomOffset - buttonHeight
    const bottomOffset = 96;
    const initialY = windowHeight - bottomOffset - BUTTON_SIZE_PX;

    return { x: initialX, y: initialY };
  };

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleStart = (x, y, rect) => {
    setIsDragging(true);
    setStartPos({ x, y });
    setDragOffset({
      x: x - rect.left,
      y: y - rect.top,
    });
  };

  const handleMove = (x, y) => {
    if (!isDragging) return;
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    const maxX = window.innerWidth - BUTTON_SIZE_PX;
    const maxY = window.innerHeight - BUTTON_SIZE_PX;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };


  // --- Event Handlers ---
  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleStart(e.clientX, e.clientY, rect);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    handleStart(touch.clientX, touch.clientY, rect);
  };

  const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const handleEnd = () => setIsDragging(false);

  const handleClick = (e) => {
    const x = e.touches?.[0]?.clientX ?? e.clientX;
    const y = e.touches?.[0]?.clientY ?? e.clientY;
    const dx = Math.abs(x - startPos.x);
    const dy = Math.abs(y - startPos.y);
    const moved = dx > 5 || dy > 5;

    if (!moved) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const updatePositionOnResize = () => {
      if (!isDragging) {
        setPosition(initialPosition());
      }
    };

    window.addEventListener('resize', updatePositionOnResize);

    if (!isDragging) {
      return () => window.removeEventListener('resize', updatePositionOnResize);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      window.removeEventListener('resize', updatePositionOnResize);
    };
  }, [isDragging, dragOffset]);


  return (
    <div
      className={`fixed z-50 w-11 h-11 bg-gradient-to-r from-indigo-600 to-purple-700
                  rounded-full shadow-lg select-none transition-transform
                  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                  ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      title=""
    >
      <div
        className="w-11 h-11 flex items-center justify-center rounded-full text-white font-bold relative"
      >
        <span className="text-sm tracking-wide">VINI</span>
      </div>
    </div>
  );
}

export default FloatingButton;
