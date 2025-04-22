import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { useMusicPlayer } from '../../context/MusicContext';

function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    songQueue,
    handleNext,
    handlePrevious,
    togglePlay,
    closeMusicPlayer
  } = useMusicPlayer();

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    if (currentSong) {
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        audio.load();
      }
      isPlaying ? audio.play() : audio.pause();
    }

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded      = () => handleNext();

    audio.addEventListener('timeupdate',    onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended',          onEnded);

    return () => {
      audio.removeEventListener('timeupdate',    onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended',          onEnded);
    };
  }, [currentSong, isPlaying, handleNext]);

  const handleSeek = e => {
    const t = +e.target.value;
    audioRef.current.currentTime = t;
    setProgress(t);
  };

  const formatTime = t => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed top-20 inset-x-0 bg-white border-t shadow-lg z-0">
      <div className="max-w-screen-xl mx-auto grid grid-cols-3 items-center p-2 sm:grid-cols-2 sm:gap-2">

        <div className="col-span-1 sm:col-span-2">
          <h3 className="font-medium truncate">{currentSong.name}</h3>
        </div>

        <div className="col-span-2 sm:col-span-2 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              disabled={songQueue.length <= 1}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              onClick={handleNext}
              disabled={songQueue.length <= 1}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-gray-500 w-10">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-200 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            audioRef.current.pause();      
            closeMusicPlayer();            
          }}
          className="absolute top-1 right-3 p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default MusicPlayer;
