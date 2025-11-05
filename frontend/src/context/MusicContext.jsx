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

  // Initialize the audio element
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

  // Select a song to play
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
    audioRef.current.currentTime = clamped;
    setProgress(clamped);
  };

  const closeMusicPlayer = () => {
    const audio = audioRef.current;
    audio.pause();
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

  // 🧩 Main audio sync logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.pause();
      return;
    }

    // Load new track
    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url;
      audio.load();
    }

    // Play or pause depending on state
    const playPromise = isPlaying ? audio.play() : audio.pause();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        console.warn('Audio playback error:', error);
      });
    }

    // Core event listeners
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded = () => {
      handleNext();
      setIsPlaying(true);
    };
    const onError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    // 🔹 Detect system interruptions or manual pause
    const onPause = () => {
      // Prevent false negatives caused by switching songs
      if (!audio.ended && !audio.paused) return;
      setIsPlaying(false);
    };

    // 🔹 Detect resume (when system returns audio focus)
    const onPlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [currentSong, isPlaying]);

  // 🧩 Detect system-level interruptions & resume when possible
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleVisibilityChange = () => {
      // If tab hidden, pause (prevents background blocking)
      if (document.hidden && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      } 
      // If tab visible again and song was playing, try resume
      else if (!document.hidden && currentSong && !audio.paused && !isPlaying) {
        const resume = audio.play();
        if (resume && typeof resume.catch === 'function') {
          resume.catch(() => {});
        }
        setIsPlaying(true);
      }
    };

    const handleFocus = () => {
      // Sometimes after a phone call or notification, audio resumes muted
      // We'll try to replay to restore sound
      if (currentSong && !isPlaying && !audio.paused) {
        const tryResume = audio.play();
        if (tryResume && typeof tryResume.catch === 'function') {
          tryResume.catch(() => {});
        }
        setIsPlaying(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentSong, isPlaying]);

  // 🧩 Keep MediaSession updated
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
          { src: '/logo/512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('play', () => { if (!isPlaying) togglePlay(); });
      navigator.mediaSession.setActionHandler('pause', () => { if (isPlaying) togglePlay(); });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentSong, isPlaying]);

  // 🧩 Keep MediaSession position in sync
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(progress, duration),
        });
      } catch (err) {
        console.warn('MediaSession.setPositionState failed:', err);
      }
    }
  }, [progress, duration, currentSong]);

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
        closeMusicPlayer,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
