import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

function MusicPlayer({
  song,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    // Update the audio source if the song changes
    if (audio.src !== song.url) {
      audio.src = song.url;
      audio.load();
    }

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (hasNext) {
        onNext();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [song, isPlaying, hasNext, onNext]);

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 md:left-64 md:right-0 bg-white border-t shadow-lg p-4 z-50">
      <div >
        {/* Song Details */}
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div>
            <h3 className="font-medium">{song.name}</h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={onPlayPause}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <SkipForward className="h-6 w-6" />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-gray-500">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm text-gray-500">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Spacer for layout symmetry */}
        <div className="w-40" />
      </div>
    </div>
  );
}

export default MusicPlayer;
