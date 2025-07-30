import { createContext, useContext, useState, useRef, useEffect } from 'react';
const MusicContext = createContext();
export const useMusicPlayer = () => useContext(MusicContext);

export function MusicProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [songQueue, setSongQueue]     = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);

  // synchronize audio element whenever currentSong or isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url;
      audio.load();
    }
    isPlaying ? audio.play() : audio.pause();
    
    const onTimeUpdate    = () => setProgress(audio.currentTime);
    const onLoadedMeta    = () => setDuration(audio.duration);
    const onEnded         = () => handleNext();
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSong, isPlaying]);

  const handleSongSelect = (song, queue) => {
    const idx = queue.findIndex(s => s._id === song._id);
    setSongQueue(queue);
    setCurrentSongIndex(idx);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!songQueue.length) return;
    const next = (currentSongIndex + 1) % songQueue.length;
    setCurrentSongIndex(next);
    setCurrentSong(songQueue[next]);
  };
  const handlePrevious = () => {
    if (!songQueue.length) return;
    const prev = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    setCurrentSongIndex(prev);
    setCurrentSong(songQueue[prev]);
  };
  const togglePlay = () => setIsPlaying(p => !p);
  const seek = t => {
    audioRef.current.currentTime = Math.min(Math.max(0, t), duration);
    setProgress(audioRef.current.currentTime);
  };
  const closeMusicPlayer = () => {
    audioRef.current.pause();
    setCurrentSong(null);
    setIsPlaying(false);
    setSongQueue([]);
    setCurrentSongIndex(0);
    setProgress(0);
    setDuration(0);
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      songQueue,
      currentSongIndex,
      progress,
      duration,
      handleSongSelect,
      handleNext,
      handlePrevious,
      togglePlay,
      seek,
      closeMusicPlayer,
    }}>
      {children}
    </MusicContext.Provider>
  );
}
