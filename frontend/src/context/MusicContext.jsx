import { createContext, useContext, useRef, useState, useEffect } from 'react';

const MusicContext = createContext();
export const useMusicPlayer = () => useContext(MusicContext);

export function MusicProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songQueue, setSongQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ─── Playback Controls ───────────────────────────────
  const handleSongSelect = (song, queue) => {
    const idx = queue.findIndex(s => s._id === song._id);
    if (idx < 0) return;

    setSongQueue(queue);
    setCurrentSongIndex(idx);
    setCurrentSong(queue[idx]);
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
    const clamped = Math.min(Math.max(0, t), duration || 0);
    audioRef.current.currentTime = clamped;
    setProgress(clamped);
  };

  const closeMusicPlayer = () => {
    audioRef.current.pause();
    setCurrentSong(null);
    setIsPlaying(false);
    setSongQueue([]);
    setCurrentSongIndex(0);
    setProgress(0);
    setDuration(0);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  };

  // ─── Sync <audio> with song & playback state ─────────────
  useEffect(() => {
    const audio = audioRef.current;

    if (!currentSong) {
      audio.pause();
      return;
    }

    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url;
      audio.load();
    }

    isPlaying ? audio.play() : audio.pause();

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSong, isPlaying]);

  // ─── Media Session Metadata & Controls ─────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: currentSong.collectionName,
      album: currentSong.collectionName,
      artwork: [
        { src: '/logo/96.png', sizes: '96x96', type: 'image/png' },
        { src: '/logo/128.png', sizes: '128x128', type: 'image/png' },
        { src: '/logo/192.png', sizes: '192x192', type: 'image/png' },
        { src: '/logo/384.png', sizes: '384x384', type: 'image/png' },
        { src: '/logo/512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlaying) togglePlay();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlaying) togglePlay();
    });
    navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
    navigator.mediaSession.setActionHandler('nexttrack', handleNext);
  }, [currentSong, isPlaying, handleNext, handlePrevious, togglePlay]);

  // ─── Update MediaSession playback position ─────────────
  useEffect(() => {
    if (
      'mediaSession' in navigator &&
      currentSong &&
      duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(progress, duration)
        });
      } catch (err) {
        console.warn('MediaSession.setPositionState failed:', err);
      }
    }
  }, [progress, duration, currentSong]);

  // ─── Keep MediaSession alive when paused ─────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentSong || !duration) return;

    let intervalId;

    if (!isPlaying) {
      intervalId = setInterval(() => {
        try {
          navigator.mediaSession.setPositionState({
            duration,
            playbackRate: 0,
            position: Math.min(progress, duration),
          });
        } catch (err) {
          console.warn('Failed to set paused media session state:', err);
        }
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, progress, duration, currentSong]);

  // ─── Update playbackState on tab visibility change ─────────────
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden && currentSong && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [currentSong, isPlaying]);

  // ─── Restore playbackState when window is focused ─────────────
  useEffect(() => {
    const handleFocus = () => {
      if (currentSong && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentSong, isPlaying]);

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      songQueue,
      progress,
      duration,
      handleSongSelect,
      handleNext,
      handlePrevious,
      togglePlay,
      seek,
      closeMusicPlayer
    }}>
      {children}
    </MusicContext.Provider>
  );
}
