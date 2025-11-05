import { createContext, useContext, useRef, useState, useEffect } from 'react';

const MusicContext = createContext();
export const useMusicPlayer = () => useContext(MusicContext);

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songQueue, setSongQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  // --- Playback controls ---
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
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!songQueue.length) return;
    const prev = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    setCurrentSongIndex(prev);
    setCurrentSong(songQueue[prev]);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(p => !p);

  const seek = t => {
    const clamped = Math.min(Math.max(0, t), duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
    setProgress(clamped);
  };

  const closeMusicPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
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

  // listeners and handle song changes 
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    const onError = e => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    if (!currentSong) {
      audio.pause();
      audio.src = '';
    } else {
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        audio.load();
      }

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMeta);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentSong]);

  // Control play/pause from React state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio playback error:', error);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // MediaSession metadata & handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSong) {
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
    } else {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  }, [currentSong, isPlaying, handlePrevious, handleNext]);

  // Update MediaSession playback position
  useEffect(() => {
    if (
      'mediaSession' in navigator &&
      currentSong &&
      duration > 0 &&
      navigator.mediaSession.setPositionState
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

  // Keep playback state alive on visibility change
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden && currentSong && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [currentSong, isPlaying]);

  // Restore playback state when window is focused
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
    <MusicContext.Provider
      value={{
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}