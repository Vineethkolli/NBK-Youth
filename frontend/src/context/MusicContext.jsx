import { createContext, useContext, useState } from 'react';

const MusicContext = createContext();

export const useMusicPlayer = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songQueue, setSongQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const handleSongSelect = (song, queue) => {
    const index = queue.findIndex(s => s._id === song._id);
    setCurrentSongIndex(index);
    setCurrentSong(song);
    setSongQueue(queue);
    setIsPlaying(true);
  };

  const handleNext = () => {
    const nextIndex = (currentSongIndex + 1) % songQueue.length;
    setCurrentSongIndex(nextIndex);
    setCurrentSong(songQueue[nextIndex]);
  };

  const handlePrevious = () => {
    const prevIndex = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    setCurrentSongIndex(prevIndex);
    setCurrentSong(songQueue[prevIndex]);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const closeMusicPlayer = () => {
    setCurrentSong(null);
    setIsPlaying(false);
    setSongQueue([]);
    setCurrentSongIndex(0);
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      songQueue,
      currentSongIndex,
      handleSongSelect,
      handleNext,
      handlePrevious,
      togglePlay,
      closeMusicPlayer
    }}>
      {children}
    </MusicContext.Provider>
  );
};