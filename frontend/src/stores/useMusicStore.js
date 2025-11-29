import { create } from 'zustand';

const audio = new Audio();

let audioEventsInitialized = false;
let mediaSessionInitialized = false;
let visibilityHandlersInitialized = false;

const useMusicStore = create((set, get) => ({

  currentSong: null,
  isPlaying: false,
  songQueue: [],
  currentSongIndex: 0,
  progress: 0,
  duration: 0,

  initAudioEvents: () => {
    if (audioEventsInitialized) return;
    audioEventsInitialized = true;

    audio.addEventListener("timeupdate", () => {
      set({ progress: audio.currentTime });
    });

    audio.addEventListener("loadedmetadata", () => {
      set({ duration: audio.duration });
    });

    audio.addEventListener("ended", () => {
      const { handleNext } = get();
      handleNext();
      set({ isPlaying: true });
    });

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      set({ isPlaying: false });
    });
  },

  handleSongSelect: (song, queue) => {
    get().initAudioEvents();

    const idx = queue.findIndex((s) => s._id === song._id);
    if (idx < 0) return;

    const nextSong = queue[idx];

    set({
      songQueue: queue,
      currentSongIndex: idx,
      currentSong: nextSong,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });

    if (audio.src !== nextSong.url) {
      audio.src = nextSong.url;
      audio.load();
    }

    audio.play().catch((e) => console.warn("Audio play error:", e));

    const { updateMediaSessionMeta } = get();
    updateMediaSessionMeta(nextSong);
  },

  handleNext: () => {
    const { songQueue, currentSongIndex } = get();
    if (!songQueue.length) return;

    const nextIndex = (currentSongIndex + 1) % songQueue.length;
    const nextSong = songQueue[nextIndex];

    set({
      currentSongIndex: nextIndex,
      currentSong: nextSong,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });

    if (audio.src !== nextSong.url) {
      audio.src = nextSong.url;
      audio.load();
    }

    audio.play().catch((e) => console.warn("Audio play error:", e));

    const { updateMediaSessionMeta } = get();
    updateMediaSessionMeta(nextSong);
  },

  handlePrevious: () => {
    const { songQueue, currentSongIndex } = get();
    if (!songQueue.length) return;

    const prevIndex =
      (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    const prevSong = songQueue[prevIndex];

    set({
      currentSongIndex: prevIndex,
      currentSong: prevSong,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });

    if (audio.src !== prevSong.url) {
      audio.src = prevSong.url;
      audio.load();
    }

    audio.play().catch((e) => console.warn("Audio play error:", e));

    const { updateMediaSessionMeta } = get();
    updateMediaSessionMeta(prevSong);
  },

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (!currentSong) return;

    const newState = !isPlaying;

    set({ isPlaying: newState });

    const action = newState ? audio.play() : audio.pause();
    action?.catch?.((e) => console.warn("Audio toggle error:", e));

    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = newState ? "playing" : "paused";
  },

  seek: (t) => {
    const { duration } = get();
    const clamped = Math.min(Math.max(0, t), duration || 0);
    audio.currentTime = clamped;
    set({ progress: clamped });
  },

  closeMusicPlayer: () => {
    audio.pause();
    set({
      currentSong: null,
      isPlaying: false,
      songQueue: [],
      currentSongIndex: 0,
      progress: 0,
      duration: 0,
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  },

  updateMediaSessionMeta: (song) => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song.collectionName,
      album: song.collectionName,
      artwork: [
        { src: "/logo/96.png", sizes: "96x96", type: "image/png" },
        { src: "/logo/128.png", sizes: "128x128", type: "image/png" },
        { src: "/logo/192.png", sizes: "192x192", type: "image/png" },
        { src: "/logo/384.png", sizes: "384x384", type: "image/png" },
        { src: "/logo/512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.playbackState = "playing";
  },
}));

// Initialize MediaSession Handlers
if ("mediaSession" in navigator && !mediaSessionInitialized) {
  mediaSessionInitialized = true;

  navigator.mediaSession.setActionHandler("play", () => {
    const { isPlaying, togglePlay } = useMusicStore.getState();
    if (!isPlaying) togglePlay();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    const { isPlaying, togglePlay } = useMusicStore.getState();
    if (isPlaying) togglePlay();
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    useMusicStore.getState().handlePrevious();
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    useMusicStore.getState().handleNext();
  });
}

// Initialize Visibility Handlers
if (!visibilityHandlersInitialized) {
  visibilityHandlersInitialized = true;

  document.addEventListener("visibilitychange", () => {
    const { currentSong, isPlaying } = useMusicStore.getState();
    if (document.hidden && currentSong && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  });

  window.addEventListener("focus", () => {
    const { currentSong, isPlaying } = useMusicStore.getState();
    if (currentSong && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  });
}

// Sync MediaSession position
useMusicStore.subscribe((state) => {
  if ("mediaSession" in navigator && state.currentSong && state.duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: 1,
        position: Math.min(state.progress, state.duration),
      });
    } catch (err) {
      console.warn("MediaSession.setPositionState failed:", err);
    }
  }
});

export default useMusicStore;
