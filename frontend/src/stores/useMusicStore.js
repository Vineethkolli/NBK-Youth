import { create } from "zustand";

const audio = new Audio();
audio.preload = "auto";
audio.setAttribute("playsinline", "true");

let audioEventsInitialized = false;
let mediaSessionInitialized = false;
let visibilityHandlersInitialized = false;

let shouldResumePlayback = false;
let recoveryTimer = null;
let recoveryAttempts = 0;
let playbackRequestId = 0;

const MAX_RECOVERY_ATTEMPTS = 8;
const BASE_RECOVERY_DELAY = 1000;
const MAX_RECOVERY_DELAY = 15000;

const isMediaSessionSupported = () =>
  typeof navigator !== "undefined" && "mediaSession" in navigator;

const setMediaSessionPlaybackState = (state) => {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch (error) {
    console.warn("MediaSession playback state error:", error);
  }
};

const clearRecoveryTimer = () => {
  if (recoveryTimer) {
    clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }
};

const resetRecovery = () => {
  clearRecoveryTimer();
  recoveryAttempts = 0;
};

const getRecoveryDelay = () => {
  const delay =
    BASE_RECOVERY_DELAY * Math.pow(2, Math.max(0, recoveryAttempts - 1));
  return Math.min(delay, MAX_RECOVERY_DELAY);
};

const scheduleAudioRecovery = () => {
  if (!shouldResumePlayback) return;
  if (!audio.src) return;
  if (!audio.paused) return;
  if (recoveryTimer) return;

  if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    console.warn("Audio recovery attempts exhausted.");
    clearRecoveryTimer();
    shouldResumePlayback = false;
    useMusicStore.setState({ isPlaying: false });
    setMediaSessionPlaybackState("paused");
    return;
  }

  recoveryAttempts += 1;
  const delay = getRecoveryDelay();

  recoveryTimer = setTimeout(async () => {
    recoveryTimer = null;

    if (!shouldResumePlayback || !audio.src || !audio.paused) return;

    try {
      await audio.play();

      if (shouldResumePlayback) {
        resetRecovery();
        useMusicStore.setState({ isPlaying: true });
        setMediaSessionPlaybackState("playing");
      }
    } catch (error) {
      console.warn("Audio recovery attempt failed:", error);
      if (shouldResumePlayback) {
        scheduleAudioRecovery();
      }
    }
  }, delay);
};

const playAudioElement = async () => {
  if (!audio.src) return false;

  try {
    await audio.play();
    return true;
  } catch (error) {
    console.warn("Audio play failed:", error);
    return false;
  }
};

const setAudioSource = (url) => {
  if (!url) return false;

  const absoluteUrl = new URL(url, window.location.href).href;

  if (audio.src !== absoluteUrl) {
    audio.src = absoluteUrl;
    audio.load();
  } else {
    try {
      audio.currentTime = 0;
    } catch (error) {
      console.warn("Audio reset failed:", error);
    }
  }

  return true;
};

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
      const currentTime = Number.isFinite(audio.currentTime)
        ? audio.currentTime
        : 0;

      set({ progress: currentTime });
    });

    audio.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;

      set({
        duration,
        progress: Math.min(audio.currentTime || 0, duration || Infinity),
      });
    });

    audio.addEventListener("durationchange", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;

      if (duration > 0) {
        set({ duration });
      }
    });

    audio.addEventListener("play", () => {
      if (!shouldResumePlayback) {
        audio.pause();
        return;
      }

      resetRecovery();
      set({ isPlaying: true });
      setMediaSessionPlaybackState("playing");
    });

    audio.addEventListener("playing", () => {
      if (!shouldResumePlayback) {
        audio.pause();
        return;
      }

      resetRecovery();
      set({ isPlaying: true });
      setMediaSessionPlaybackState("playing");
    });

    audio.addEventListener("pause", () => {
      if (!shouldResumePlayback) {
        set({ isPlaying: false });
        setMediaSessionPlaybackState("paused");
        return;
      }

      if (audio.ended || audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      scheduleAudioRecovery();
    });

    audio.addEventListener("waiting", () => {
      if (!shouldResumePlayback) return;

      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      scheduleAudioRecovery();
    });

    audio.addEventListener("stalled", () => {
      if (!shouldResumePlayback) return;

      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      scheduleAudioRecovery();
    });

    audio.addEventListener("canplay", () => {
      if (!shouldResumePlayback || !audio.paused) return;

      clearRecoveryTimer();

      playAudioElement().then((success) => {
        if (success && shouldResumePlayback) {
          resetRecovery();
          set({ isPlaying: true });
          setMediaSessionPlaybackState("playing");
        } else if (shouldResumePlayback) {
          scheduleAudioRecovery();
        }
      });
    });

    audio.addEventListener("error", () => {
      const mediaError = audio.error;

      console.error("Audio error:", {
        code: mediaError?.code,
        message: mediaError?.message,
        src: audio.src,
      });

      if (!shouldResumePlayback) {
        set({ isPlaying: false });
        setMediaSessionPlaybackState("paused");
        return;
      }

      if (mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        shouldResumePlayback = false;
        set({ isPlaying: false });
        setMediaSessionPlaybackState("paused");
        return;
      }

      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      scheduleAudioRecovery();
    });

    audio.addEventListener("ended", () => {
      if (!shouldResumePlayback) {
        set({ isPlaying: false });
        setMediaSessionPlaybackState("paused");
        return;
      }

      resetRecovery();
      get().handleNext();
    });

    audio.addEventListener("emptied", () => {
      if (!audio.src) {
        set({
          progress: 0,
          duration: 0,
          isPlaying: false,
        });
      }
    });
  },

  playAudio: async () => {
    get().initAudioEvents();

    shouldResumePlayback = true;
    const requestId = ++playbackRequestId;

    clearRecoveryTimer();

    const success = await playAudioElement();

    if (requestId !== playbackRequestId) return false;

    if (success) {
      resetRecovery();

      if (shouldResumePlayback) {
        set({ isPlaying: true });
        setMediaSessionPlaybackState("playing");
      }

      return true;
    }

    if (shouldResumePlayback) {
      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      scheduleAudioRecovery();
    }

    return false;
  },

  handleSongSelect: (song, queue) => {
    if (!song || !Array.isArray(queue) || queue.length === 0) return;

    get().initAudioEvents();

    const idx = queue.findIndex((s) => s._id === song._id);

    if (idx < 0) {
      console.warn("Selected song was not found in queue.");
      return;
    }

    const selectedSong = queue[idx];

    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();
    shouldResumePlayback = true;

    set({
      songQueue: queue,
      currentSongIndex: idx,
      currentSong: selectedSong,
      isPlaying: false,
      progress: 0,
      duration: 0,
    });

    if (!selectedSong.url) {
      console.error("Selected song has no audio URL.");
      shouldResumePlayback = false;
      set({ isPlaying: false });
      return;
    }

    setAudioSource(selectedSong.url);
    get().updateMediaSessionMeta(selectedSong);
    get().playAudio();
  },

  handleNext: () => {
    const { songQueue, currentSongIndex } = get();

    if (!songQueue.length) {
      shouldResumePlayback = false;
      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      return;
    }

    const nextIndex = (currentSongIndex + 1) % songQueue.length;
    const nextSong = songQueue[nextIndex];

    if (!nextSong?.url) {
      console.error("Next song has no audio URL.");
      shouldResumePlayback = false;
      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      return;
    }

    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();
    shouldResumePlayback = true;

    set({
      currentSongIndex: nextIndex,
      currentSong: nextSong,
      isPlaying: false,
      progress: 0,
      duration: 0,
    });

    setAudioSource(nextSong.url);
    get().updateMediaSessionMeta(nextSong);
    get().playAudio();
  },

  handlePrevious: () => {
    const { songQueue, currentSongIndex } = get();

    if (!songQueue.length) {
      shouldResumePlayback = false;
      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      return;
    }

    const prevIndex =
      (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    const prevSong = songQueue[prevIndex];

    if (!prevSong?.url) {
      console.error("Previous song has no audio URL.");
      shouldResumePlayback = false;
      set({ isPlaying: false });
      setMediaSessionPlaybackState("paused");
      return;
    }

    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();
    shouldResumePlayback = true;

    set({
      currentSongIndex: prevIndex,
      currentSong: prevSong,
      isPlaying: false,
      progress: 0,
      duration: 0,
    });

    setAudioSource(prevSong.url);
    get().updateMediaSessionMeta(prevSong);
    get().playAudio();
  },

  togglePlay: async () => {
    const { currentSong } = get();

    if (!currentSong) return;

    if (audio.paused) {
      shouldResumePlayback = true;
      set({ isPlaying: false });

      const success = await get().playAudio();

      if (!success && shouldResumePlayback) {
        set({ isPlaying: false });
      }

      return;
    }

    shouldResumePlayback = false;
    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();

    audio.pause();

    set({ isPlaying: false });
    setMediaSessionPlaybackState("paused");
  },

  seek: (t) => {
    const { duration } = get();

    if (!Number.isFinite(t)) return;

    const safeDuration =
      Number.isFinite(duration) && duration > 0
        ? duration
        : Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0;

    const clamped = Math.min(
      Math.max(0, t),
      safeDuration
    );

    try {
      audio.currentTime = clamped;
    } catch (error) {
      console.warn("Audio seek failed:", error);
    }

    set({ progress: clamped });
  },

  closeMusicPlayer: () => {
    shouldResumePlayback = false;
    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();

    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    set({
      currentSong: null,
      isPlaying: false,
      songQueue: [],
      currentSongIndex: 0,
      progress: 0,
      duration: 0,
    });

    if (isMediaSessionSupported()) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      } catch (error) {
        console.warn("MediaSession close error:", error);
      }
    }
  },

  updateMediaSessionMeta: (song) => {
    if (!isMediaSessionSupported() || !song) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || "Unknown Song",
        artist: song.collectionName || "Vibe",
        album: song.collectionName || "Vibe",
        artwork: [
          {
            src: "/logo/96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/logo/128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/logo/192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo/384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/logo/512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });

      setMediaSessionPlaybackState(
        shouldResumePlayback ? "playing" : "paused"
      );
    } catch (error) {
      console.warn("MediaSession metadata error:", error);
    }
  },
}));

const registerMediaSessionHandler = (action, handler) => {
  if (!isMediaSessionSupported()) return;

  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch (error) {
    console.warn(
      `MediaSession action "${action}" is not supported:`,
      error
    );
  }
};

if (isMediaSessionSupported() && !mediaSessionInitialized) {
  mediaSessionInitialized = true;

  registerMediaSessionHandler("play", () => {
    const { currentSong } = useMusicStore.getState();
    if (!currentSong) return;

    useMusicStore.getState().playAudio();
  });

  registerMediaSessionHandler("pause", () => {
    const { currentSong } = useMusicStore.getState();
    if (!currentSong) return;

    shouldResumePlayback = false;
    playbackRequestId += 1;
    clearRecoveryTimer();
    resetRecovery();

    audio.pause();

    useMusicStore.setState({ isPlaying: false });
    setMediaSessionPlaybackState("paused");
  });

  registerMediaSessionHandler("previoustrack", () => {
    useMusicStore.getState().handlePrevious();
  });

  registerMediaSessionHandler("nexttrack", () => {
    useMusicStore.getState().handleNext();
  });

  registerMediaSessionHandler("seekbackward", (details) => {
    const { progress, seek } = useMusicStore.getState();

    const offset =
      Number.isFinite(details?.seekOffset) && details.seekOffset > 0
        ? details.seekOffset
        : 10;

    seek(progress - offset);
  });

  registerMediaSessionHandler("seekforward", (details) => {
    const { progress, seek } = useMusicStore.getState();

    const offset =
      Number.isFinite(details?.seekOffset) && details.seekOffset > 0
        ? details.seekOffset
        : 10;

    seek(progress + offset);
  });

  registerMediaSessionHandler("seekto", (details) => {
    if (typeof details?.seekTime === "number") {
      useMusicStore.getState().seek(details.seekTime);
    }
  });
}

if (
  typeof document !== "undefined" &&
  !visibilityHandlersInitialized
) {
  visibilityHandlersInitialized = true;

  document.addEventListener("visibilitychange", () => {
    const { currentSong } = useMusicStore.getState();

    if (!currentSong) return;

    if (document.hidden) {
      setMediaSessionPlaybackState(
        shouldResumePlayback ? "playing" : "paused"
      );
      return;
    }

    if (shouldResumePlayback && audio.paused) {
      useMusicStore.getState().playAudio();
    } else if (!shouldResumePlayback) {
      setMediaSessionPlaybackState("paused");
    }
  });

  window.addEventListener("focus", () => {
    const { currentSong } = useMusicStore.getState();

    if (!currentSong) return;

    if (shouldResumePlayback && audio.paused) {
      useMusicStore.getState().playAudio();
    } else {
      setMediaSessionPlaybackState(
        shouldResumePlayback ? "playing" : "paused"
      );
    }
  });

  window.addEventListener("pageshow", () => {
    const { currentSong } = useMusicStore.getState();

    if (!currentSong) return;

    if (shouldResumePlayback && audio.paused) {
      useMusicStore.getState().playAudio();
    }
  });
}

useMusicStore.subscribe((state) => {
  if (!isMediaSessionSupported()) return;
  if (!state.currentSong) return;

  const duration = Number.isFinite(state.duration)
    ? state.duration
    : 0;

  const progress = Number.isFinite(state.progress)
    ? state.progress
    : 0;

  if (duration <= 0) return;

  const position = Math.min(
    Math.max(0, progress),
    duration
  );

  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: Number.isFinite(audio.playbackRate)
        ? audio.playbackRate
        : 1,
      position,
    });
  } catch (error) {
    console.warn(
      "MediaSession.setPositionState failed:",
      error
    );
  }
});

export default useMusicStore;
