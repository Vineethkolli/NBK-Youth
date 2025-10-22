import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMusicPlayer } from '../../context/MusicContext';

function FloatingMusicIcon() {
  const { currentSong, isPlaying } = useMusicPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [position, setPosition] = useState({ x: 20, y: 100 });
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
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

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
      navigate('/vibe');
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  if (!currentSong || location.pathname === '/vibe') return null;

  return (
    <div
      className={`fixed z-50 w-11 h-11 bg-gradient-to-r from-indigo-500 to-purple-600
                  rounded-full shadow-lg select-none transition-transform
                  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <div className="w-full h-full flex items-center justify-center text-white">
        {isPlaying ? (
          <div className="flex space-x-0.5 items-center justify-center">
            {[20, 16, 12, 10].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full animate-bounce animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '500ms',
                }}
              />
            ))}
          </div>
        ) : (
           <div className="flex space-x-0.5 items-center justify-center">
            {[20, 16, 12, 10].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full"
                style={{
                  height: `${h}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isPlaying && (
        <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
      )}
    </div>
  );
}

export default FloatingMusicIcon;
