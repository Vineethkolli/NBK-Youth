import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMusicPlayer } from '../../context/MusicContext';

function FloatingMusicIcon() {
  // ─── all your hooks first ───────────────────────────────────────────────────
  const { currentSong, isPlaying } = useMusicPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [position, setPosition]   = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // ─── event handlers (ordinary functions, not hooks) ────────────────────────
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isDragging) navigate('/vibe');
  };

  // ─── now your one useEffect ────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // ─── only after all hooks do we bail out ───────────────────────────────────
  if (!currentSong || location.pathname === '/vibe') {
    return null;
  }

  // ─── render when we do have a song and aren't on /vibe ────────────────────
  return (
    <div
      className={`fixed z-50 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600
                  rounded-full shadow-lg select-none transition-transform hover:scale-110
                  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="w-full h-full flex items-center justify-center text-white">
        {isPlaying ? (
          <div className="flex space-x-0.5">
            {[20, 16, 12, 16].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full animate-bounce"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '600ms'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-6 h-6 border-l-4 border-white rounded-full" />
        )}
      </div>

      {isPlaying && (
        <div className="absolute inset-0 rounded-full border-2 border-white opacity-30 animate-ping" />
      )}
    </div>
  );
}

export default FloatingMusicIcon;
