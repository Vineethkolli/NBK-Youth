import { create } from 'zustand';

const useMusicStore = create((set, get) => {
  let audioRef = null;

  const initAudio = () => {
    if (!audioRef) {
      audioRef = new Audio();
      
      const onTimeUpdate = () => {
        set({ progress: audioRef.currentTime });
      };
      
      const onLoadedMeta = () => {
        set({ duration: audioRef.duration });
      };
      
      const onEnded = () => {
        const { handleNext } = get();
        handleNext();
        set({ isPlaying: true });
      };
      
      const onError = (e) => {
        console.error('Audio error:', e);
        set({ isPlaying: false });
      };

      audioRef.addEventListener('timeupdate', onTimeUpdate);
      audioRef.addEventListener('loadedmetadata', onLoadedMeta);
      audioRef.addEventListener('ended', onEnded);
      audioRef.addEventListener('error', onError);
    }
    return audioRef;
  };

  return {
    currentSong: null,
    isPlaying: false,
    songQueue: [],
    currentSongIndex: 0,
    progress: 0,
    duration: 0,

    handleSongSelect: (song, queue) => {
      const audio = initAudio();
      const idx = queue.findIndex(s => s._id === song._id);
      if (idx < 0) return;

      set({
        songQueue: queue,
        currentSongIndex: idx,
        currentSong: queue[idx],
        isPlaying: true
      });

      const currentSong = queue[idx];
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('Audio playback error:', error);
        });
      }

      // Update MediaSession
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.name,
          artist: currentSong.collectionName,
          album: currentSong.collectionName,
          artwork: [
            { src: '/logo/96.png',  sizes: '96x96',  type: 'image/png' },
            { src: '/logo/128.png', sizes: '128x128', type: 'image/png' },
            { src: '/logo/192.png', sizes: '192x192', type: 'image/png' },
            { src: '/logo/384.png', sizes: '384x384', type: 'image/png' },
            { src: '/logo/512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    },

    handleNext: () => {
      const { songQueue, currentSongIndex } = get();
      if (!songQueue.length) return;
      
      const audio = initAudio();
      const next = (currentSongIndex + 1) % songQueue.length;
      const nextSong = songQueue[next];
      
      set({
        currentSongIndex: next,
        currentSong: nextSong,
        isPlaying: true
      });

      if (audio.src !== nextSong.url) {
        audio.src = nextSong.url;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('Audio playback error:', error);
        });
      }

      // Update MediaSession
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: nextSong.name,
          artist: nextSong.collectionName,
          album: nextSong.collectionName,
          artwork: [
            { src: '/logo/96.png',  sizes: '96x96',  type: 'image/png' },
            { src: '/logo/128.png', sizes: '128x128', type: 'image/png' },
            { src: '/logo/192.png', sizes: '192x192', type: 'image/png' },
            { src: '/logo/384.png', sizes: '384x384', type: 'image/png' },
            { src: '/logo/512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    },

    handlePrevious: () => {
      const { songQueue, currentSongIndex } = get();
      if (!songQueue.length) return;
      
      const audio = initAudio();
      const prev = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
      const prevSong = songQueue[prev];
      
      set({
        currentSongIndex: prev,
        currentSong: prevSong,
        isPlaying: true
      });

      if (audio.src !== prevSong.url) {
        audio.src = prevSong.url;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('Audio playback error:', error);
        });
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: prevSong.name,
          artist: prevSong.collectionName,
          album: prevSong.collectionName,
          artwork: [
            { src: '/logo/96.png',  sizes: '96x96',  type: 'image/png' },
            { src: '/logo/128.png', sizes: '128x128', type: 'image/png' },
            { src: '/logo/192.png', sizes: '192x192', type: 'image/png' },
            { src: '/logo/384.png', sizes: '384x384', type: 'image/png' },
            { src: '/logo/512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    },

    togglePlay: () => {
      const audio = initAudio();
      const { isPlaying, currentSong } = get();
      
      if (!currentSong) return;
      
      const newPlayingState = !isPlaying;
      set({ isPlaying: newPlayingState });

      const playPromise = newPlayingState ? audio.play() : audio.pause();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('Audio playback error:', error);
        });
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = newPlayingState ? 'playing' : 'paused';
      }
    },

    seek: (t) => {
      const audio = initAudio();
      const { duration } = get();
      const clamped = Math.min(Math.max(0, t), duration || 0);
      audio.currentTime = clamped;
      set({ progress: clamped });
    },

    closeMusicPlayer: () => {
      const audio = initAudio();
      audio.pause();
      
      set({
        currentSong: null,
        isPlaying: false,
        songQueue: [],
        currentSongIndex: 0,
        progress: 0,
        duration: 0
      });

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    }
  };
});

// Setup MediaSession action handlers once
if ('mediaSession' in navigator) {
  const store = useMusicStore.getState();
  
  navigator.mediaSession.setActionHandler('play', () => {
    const { isPlaying, togglePlay } = useMusicStore.getState();
    if (!isPlaying) togglePlay();
  });
  
  navigator.mediaSession.setActionHandler('pause', () => {
    const { isPlaying, togglePlay } = useMusicStore.getState();
    if (isPlaying) togglePlay();
  });
  
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    const { handlePrevious } = useMusicStore.getState();
    handlePrevious();
  });
  
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    const { handleNext } = useMusicStore.getState();
    handleNext();
  });
}

// Subscribe to state changes to update MediaSession position
useMusicStore.subscribe((state) => {
  if ('mediaSession' in navigator && state.currentSong && state.duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: 1,
        position: Math.min(state.progress, state.duration)
      });
    } catch (err) {
      console.warn('MediaSession.setPositionState failed:', err);
    }
  }
});

document.addEventListener('visibilitychange', () => {
  const { currentSong, isPlaying } = useMusicStore.getState();
  if (document.hidden && currentSong && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }
});

window.addEventListener('focus', () => {
  const { currentSong, isPlaying } = useMusicStore.getState();
  if (currentSong && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }
});

export default useMusicStore;
