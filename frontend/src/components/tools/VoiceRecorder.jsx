import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, RotateCcw, Save } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
}

export default function VoiceRecorder() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const liveWaveformRef = useRef([]);

  const waveformContainerRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const waveformDataRef = useRef([]);

  const isDraggingRef = useRef(false);

  // FFmpeg instance
  const ffmpegRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const resizeCanvas = () => {
    const canvas = waveformCanvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const drawWaveform = (progress = 0, mode = "recorded") => {
    const canvas = waveformCanvasRef.current;

    if (!canvas) return;

    resizeCanvas();

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const middle = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e2e8f0";
    ctx.moveTo(0, middle);
    ctx.lineTo(width, middle);
    ctx.stroke();

    const data =
      mode === "live"
        ? liveWaveformRef.current
        : waveformDataRef.current;

    if (data.length > 0) {
      const visibleCount = Math.max(1, data.length);
      const step = width / visibleCount;

      ctx.beginPath();
      ctx.lineWidth = Math.max(1, Math.floor(width / 700));
      ctx.strokeStyle =
        mode === "live" ? "#64748b" : "#475569";

      for (let i = 0; i < data.length; i += 1) {
        const amplitude =
          Math.max(0.015, Math.min(1, data[i])) *
          (height * 0.42);

        const x = Math.min(
          width,
          i * step + step / 2
        );

        ctx.moveTo(x, middle - amplitude);
        ctx.lineTo(x, middle + amplitude);
      }

      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#64748b";
      ctx.moveTo(0, middle);
      ctx.lineTo(width, middle);
      ctx.stroke();
    }

    if (
      mode === "playback" &&
      waveformDataRef.current.length > 0
    ) {
      const cursorX =
        Math.max(0, Math.min(1, progress)) * width;

      ctx.beginPath();
      ctx.lineWidth = Math.max(2, Math.floor(width / 450));
      ctx.strokeStyle = "#e11d48";
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = "#e11d48";
      ctx.arc(
        cursorX,
        height - Math.max(7, Math.floor(height * 0.035)),
        Math.max(5, Math.floor(height * 0.035)),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  };

  const stopLiveWaveform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startLiveWaveform = () => {
    stopLiveWaveform();

    const analyser = analyserRef.current;

    if (!analyser) {
      drawWaveform(0, "live");
      return;
    }

    const buffer = new Uint8Array(analyser.fftSize);

    const draw = () => {
      if (!analyserRef.current) return;

      analyser.getByteTimeDomainData(buffer);

      let peak = 0;

      for (let i = 0; i < buffer.length; i += 1) {
        const normalized =
          Math.abs(buffer[i] - 128) / 128;

        if (normalized > peak) {
          peak = normalized;
        }
      }

      liveWaveformRef.current.push(peak);

      const maxSamples = 1200;

      if (liveWaveformRef.current.length > maxSamples) {
        liveWaveformRef.current.splice(
          0,
          liveWaveformRef.current.length - maxSamples
        );
      }

      drawWaveform(0, "live");

      animationFrameRef.current =
        requestAnimationFrame(draw);
    };

    animationFrameRef.current =
      requestAnimationFrame(draw);
  };

  const createWaveform = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();

      const audioBuffer =
        await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );

      const rawData =
        audioBuffer.getChannelData(0);

      const samples = 900;

      const blockSize = Math.max(
        1,
        Math.floor(rawData.length / samples)
      );

      const waveform = [];

      for (let i = 0; i < samples; i += 1) {
        const start = i * blockSize;

        const end = Math.min(
          start + blockSize,
          rawData.length
        );

        let max = 0;

        for (let j = start; j < end; j += 1) {
          const value = Math.abs(rawData[j]);

          if (value > max) {
            max = value;
          }
        }

        waveform.push(max);
      }

      waveformDataRef.current = waveform;

      await audioContext.close();

      requestAnimationFrame(() => {
        drawWaveform(0, "playback");
      });
    } catch (err) {
      console.error(
        "Waveform creation error:",
        err
      );

      waveformDataRef.current =
        Array.from(
          { length: 900 },
          () => 0.08 + Math.random() * 0.45
        );

      requestAnimationFrame(() => {
        drawWaveform(0, "playback");
      });
    }
  };

  const startRecording = async () => {
    try {
      setError("");

      chunksRef.current = [];
      waveformDataRef.current = [];
      liveWaveformRef.current = [];

      setElapsedSeconds(0);
      setPlaybackTime(0);
      setPlaybackDuration(0);

      setIsPlaying(false);
      setIsPaused(false);
      setIsRecording(false);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(
          "Microphone recording is not supported in this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioContextClass) {
        const audioContext =
          new AudioContextClass();

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.75;

        source.connect(analyser);

        audioContextRef.current =
          audioContext;

        analyserRef.current = analyser;
      }

      const recorder =
        new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "An error occurred while recording."
        );
      };

      recorder.start(300);

      startTimer();
      startLiveWaveform();

      setHasStarted(true);
      setIsRecording(true);
      setIsPaused(false);

      requestAnimationFrame(() => {
        drawWaveform(0, "live");
      });
    } catch (err) {
      console.error(
        "Microphone error:",
        err
      );

      setError(
        "Microphone permission is required to record."
      );

      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const requestLatestChunk = async () => {
    const recorder = recorderRef.current;

    if (!recorder) return;

    if (
      recorder.state === "recording" ||
      recorder.state === "paused"
    ) {
      recorder.requestData();

      await new Promise((resolve) =>
        setTimeout(resolve, 180)
      );
    }
  };

  const buildAudioPreview = async () => {
    if (chunksRef.current.length === 0) {
      return null;
    }

    const blob = new Blob(
      chunksRef.current,
      {
        type: "audio/webm",
      }
    );

    const newUrl =
      URL.createObjectURL(blob);

    setAudioUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return newUrl;
    });

    await createWaveform(blob);

    return newUrl;
  };

  const handlePause = async () => {
    const recorder = recorderRef.current;

    if (
      !recorder ||
      recorder.state !== "recording"
    ) {
      return;
    }

    recorder.pause();

    stopTimer();
    stopLiveWaveform();

    setIsRecording(false);
    setIsPaused(true);

    await requestLatestChunk();
    await buildAudioPreview();

    setPlaybackTime(0);

    requestAnimationFrame(() => {
      drawWaveform(0, "playback");
    });
  };

  const handleContinue = async () => {
    const recorder = recorderRef.current;

    if (
      !recorder ||
      recorder.state !== "paused"
    ) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsPlaying(false);

    recorder.resume();

    startTimer();
    startLiveWaveform();

    setIsPaused(false);
    setIsRecording(true);
  };

  const handleTogglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio || !audioUrl) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error(
          "Playback error:",
          err
        );
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;

    if (!audio) return;

    const currentTime =
      Number.isFinite(audio.currentTime)
        ? audio.currentTime
        : 0;

    const duration =
      Number.isFinite(audio.duration)
        ? audio.duration
        : 0;

    setPlaybackTime(currentTime);

    if (duration > 0) {
      setPlaybackDuration(duration);

      drawWaveform(
        currentTime / duration,
        "playback"
      );
    }
  };

  const handleAudioLoaded = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (
      audio.duration &&
      Number.isFinite(audio.duration)
    ) {
      setPlaybackDuration(audio.duration);
    }

    requestAnimationFrame(() => {
      drawWaveform(0, "playback");
    });
  };

  const handleAudioEnded = () => {
    const audio = audioRef.current;

    if (!audio) return;

    setIsPlaying(false);

    const duration =
      Number.isFinite(audio.duration)
        ? audio.duration
        : 0;

    setPlaybackTime(duration);

    drawWaveform(1, "playback");
  };

  const seekFromPointer = (clientX) => {
    const container =
      waveformContainerRef.current;

    const audio = audioRef.current;

    if (
      !container ||
      !audio ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0
    ) {
      return;
    }

    const canvas =
      waveformCanvasRef.current;

    if (!canvas) return;

    const canvasRect =
      canvas.getBoundingClientRect();

    let position =
      (clientX - canvasRect.left) /
      canvasRect.width;

    position = Math.max(
      0,
      Math.min(1, position)
    );

    const newTime =
      position * audio.duration;

    audio.currentTime = newTime;

    setPlaybackTime(newTime);

    drawWaveform(
      position,
      "playback"
    );
  };

  const handlePointerDown = (event) => {
    if (!audioUrl || !audioRef.current) {
      return;
    }

    if (
      !Number.isFinite(
        audioRef.current.duration
      ) ||
      audioRef.current.duration <= 0
    ) {
      return;
    }

    event.preventDefault();

    isDraggingRef.current = true;
    setIsDragging(true);

    if (
      event.currentTarget.setPointerCapture
    ) {
      try {
        event.currentTarget.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore pointer capture errors
      }
    }

    seekFromPointer(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) return;

    event.preventDefault();

    seekFromPointer(event.clientX);
  };

  const stopPointerDrag = (event) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    if (
      event?.currentTarget
        ?.releasePointerCapture &&
      event.pointerId != null
    ) {
      try {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore pointer capture errors
      }
    }
  };

  useEffect(() => {
    const handleWindowPointerMove = (event) => {
      if (!isDraggingRef.current) return;

      event.preventDefault();

      seekFromPointer(event.clientX);
    };

    const handleWindowPointerUp = () => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener(
      "pointermove",
      handleWindowPointerMove,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      handleWindowPointerUp
    );

    window.addEventListener(
      "pointercancel",
      handleWindowPointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handleWindowPointerMove
      );

      window.removeEventListener(
        "pointerup",
        handleWindowPointerUp
      );

      window.removeEventListener(
        "pointercancel",
        handleWindowPointerUp
      );
    };
  }, [audioUrl]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (isRecording) {
          drawWaveform(0, "live");
        } else if (
          waveformDataRef.current.length
        ) {
          const progress =
            playbackDuration > 0
              ? playbackTime /
                playbackDuration
              : 0;

          drawWaveform(
            progress,
            "playback"
          );
        } else {
          drawWaveform(
            0,
            "recorded"
          );
        }
      });
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [
    isRecording,
    playbackTime,
    playbackDuration,
  ]);

  const handleReset = async () => {
    const recorder = recorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();

      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );
    }

    stopTimer();
    stopLiveWaveform();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch(() => {});

      audioContextRef.current = null;
    }

    analyserRef.current = null;

    recorderRef.current = null;
    chunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    waveformDataRef.current = [];
    liveWaveformRef.current = [];

    setAudioUrl("");
    setHasStarted(false);
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);

    setPlaybackTime(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    setIsDragging(false);

    setShowSaveModal(false);
    setIsConverting(false);
    setError("");

    requestAnimationFrame(() => {
      drawWaveform(
        0,
        "recorded"
      );
    });
  };

  const handleOpenSave = async () => {
    const recorder = recorderRef.current;

    if (
      recorder &&
      recorder.state === "recording"
    ) {
      await handlePause();
    }

    await requestLatestChunk();

    if (
      chunksRef.current.length === 0
    ) {
      setError(
        "No recording yet. Record audio first."
      );

      return;
    }

    await buildAudioPreview();

    setShowSaveModal(true);
  };

  const convertWebMToMP3 = async (
    webmBlob
  ) => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();

      ffmpegRef.current = ffmpeg;

      await ffmpeg.load();
    }

    const ffmpeg = ffmpegRef.current;

    await ffmpeg.writeFile(
      "recording.webm",
      await fetchFile(webmBlob)
    );

    await ffmpeg.exec([
      "-i",
      "recording.webm",
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "recording.mp3",
    ]);

    const mp3Data =
      await ffmpeg.readFile(
        "recording.mp3"
      );

    try {
      await ffmpeg.deleteFile(
        "recording.webm"
      );

      await ffmpeg.deleteFile(
        "recording.mp3"
      );
    } catch (cleanupError) {
      console.warn(
        "FFmpeg cleanup warning:",
        cleanupError
      );
    }

    return new Blob(
      [mp3Data.buffer],
      {
        type: "audio/mpeg",
      }
    );
  };

  const handleSaveToDevice = async () => {
    if (
      chunksRef.current.length === 0
    ) {
      return;
    }

    try {
      setError("");
      setIsConverting(true);

      await requestLatestChunk();

      const cleanName =
        sanitizeFileName(
          recordingName
        ) || "recording";

      const webmBlob = new Blob(
        chunksRef.current,
        {
          type: "audio/webm",
        }
      );

      const mp3Blob =
        await convertWebMToMP3(
          webmBlob
        );

      const url =
        URL.createObjectURL(
          mp3Blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `${cleanName}.mp3`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      setShowSaveModal(false);
    } catch (err) {
      console.error(
        "MP3 conversion error:",
        err
      );

      setError(
        "Failed to convert recording to MP3. Please try again."
      );
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      stopLiveWaveform();

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (audioContextRef.current) {
        audioContextRef.current
          .close()
          .catch(() => {});
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, []);

  useEffect(() => {
    const frame =
      requestAnimationFrame(() => {
        drawWaveform(
          0,
          "recorded"
        );
      });

    return () =>
      cancelAnimationFrame(frame);
  }, []);

  const currentProgress =
    playbackDuration > 0
      ? Math.min(
          1,
          Math.max(
            0,
            playbackTime /
              playbackDuration
          )
        )
      : 0;

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <h3 className="text-center text-3xl sm:text-4xl font-mono font-bold tracking-wide text-slate-900 notranslate">
        {formatTime(
          isPaused
            ? playbackTime
            : elapsedSeconds
        )}
      </h3>

      {!hasStarted ? (
        <div className="flex flex-col items-center justify-center py-10">
          <button
            onClick={startRecording}
            className="
              w-24 h-24 rounded-full
              bg-rose-600 hover:bg-rose-700
              active:scale-95 transition
              text-white shadow-lg
              flex items-center justify-center
            "
            title="Start recording"
            aria-label="Start recording"
          >
            <Mic size={42} />
          </button>

          <p className="mt-5 text-sm text-slate-500">
            Tap the microphone to start
            recording
          </p>
        </div>
      ) : (
        <>
          <div
            ref={waveformContainerRef}
            onPointerDown={
              audioUrl
                ? handlePointerDown
                : undefined
            }
            onPointerMove={
              audioUrl
                ? handlePointerMove
                : undefined
            }
            onPointerUp={
              audioUrl
                ? stopPointerDrag
                : undefined
            }
            onPointerCancel={
              audioUrl
                ? stopPointerDrag
                : undefined
            }
            className={`
              relative mt-6 rounded-xl
              border border-slate-200
              bg-slate-50 p-2
              overflow-hidden select-none
              ${
                audioUrl
                  ? "cursor-ew-resize"
                  : "cursor-default"
              }
            `}
            style={{
              touchAction: audioUrl
                ? "none"
                : "auto",
            }}
          >
            <canvas
              ref={
                waveformCanvasRef
              }
              width={900}
              height={180}
              className="block w-full h-32 sm:h-40 rounded-lg"
            />

            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 border border-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600 shadow-sm pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Live
              </div>
            )}

            {!isRecording &&
              audioUrl &&
              playbackDuration >
                0 && (
                <div
                  className="absolute top-2 bottom-2 left-2 right-2 pointer-events-none"
                  aria-hidden="true"
                >
                  <div
                    className={`
                      absolute top-0 bottom-0
                      w-0.5
                      bg-rose-600
                      ${
                        isDragging
                          ? "shadow-[0_0_0_3px_rgba(225,29,72,0.12)]"
                          : ""
                      }
                    `}
                    style={{
                      left: `${
                        currentProgress *
                        100
                      }%`,
                    }}
                  >
                    <div
                      className="
                        absolute
                        -bottom-1.5
                        -left-1.5
                        w-3 h-3
                        rounded-full
                        bg-rose-600
                      "
                    />
                  </div>
                </div>
              )}
          </div>

          {audioUrl &&
            playbackDuration >
              0 && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>
                  {formatTime(
                    playbackTime
                  )}
                </span>

                <span>
                  {formatTime(
                    playbackDuration
                  )}
                </span>
              </div>
            )}

          <div
            className="mt-3 text-center text-sm"
            aria-live="polite"
          >
            {isRecording && (
              <span className="text-rose-600 font-medium">
                ● Recording...
              </span>
            )}

            {isPaused &&
              !isDragging && (
                <span className="text-amber-600 font-medium">
                  Recording paused •
                  drag the line to seek
                </span>
              )}

            {isDragging && (
              <span className="text-indigo-600 font-medium">
                Seeking{" "}
                {formatTime(
                  playbackTime
                )}
              </span>
            )}
          </div>

          {isPaused &&
            audioUrl && (
              <div className="mt-5 flex items-center justify-start">
                <button
                  onClick={
                    handleTogglePlayback
                  }
                  className="
                    w-12 h-12 rounded-full
                    bg-indigo-600 hover:bg-indigo-700
                    active:scale-95 transition
                    text-white shadow-md
                    flex items-center justify-center
                  "
                  title={
                    isPlaying
                      ? "Pause playback"
                      : "Play recording"
                  }
                  aria-label={
                    isPlaying
                      ? "Pause playback"
                      : "Play recording"
                  }
                >
                  {isPlaying ? (
                    <Pause size={22} />
                  ) : (
                    <Play
                      size={22}
                      className="ml-0.5"
                    />
                  )}
                </button>
              </div>
            )}

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={
                handleReset
              }
              className="
                py-3 rounded-xl
                bg-slate-200 hover:bg-slate-300
                text-slate-900 font-semibold
                flex items-center justify-center
                gap-1.5
              "
            >
              <RotateCcw size={18} />

              <span>
                Reset
              </span>
            </button>

            {isPaused ? (
              <button
                onClick={
                  handleContinue
                }
                className="
                  py-3 rounded-xl
                  bg-emerald-600 hover:bg-emerald-700
                  text-white font-semibold
                  flex items-center justify-center
                  gap-1.5
                "
              >
                <Play size={18} />

                <span>
                  Continue
                </span>
              </button>
            ) : (
              <button
                onClick={
                  handlePause
                }
                className="
                  py-3 rounded-xl
                  bg-rose-600 hover:bg-rose-700
                  text-white font-semibold
                  flex items-center justify-center
                  gap-1.5
                "
              >
                <Pause size={18} />

                <span>
                  Pause
                </span>
              </button>
            )}

            <button
              onClick={
                handleOpenSave
              }
              className="
                py-3 rounded-xl
                bg-indigo-600 hover:bg-indigo-700
                text-white font-semibold
                flex items-center justify-center
                gap-1.5
              "
            >
              <Save size={18} />

              <span>
                Save
              </span>
            </button>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onTimeUpdate={
              handleAudioTimeUpdate
            }
            onLoadedMetadata={
              handleAudioLoaded
            }
            onEnded={
              handleAudioEnded
            }
            onPlay={() =>
              setIsPlaying(true)
            }
            onPause={() => {
              if (
                audioRef.current &&
                !audioRef.current
                  .ended
              ) {
                setIsPlaying(
                  false
                );
              }
            }}
          />
        </>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-lg font-semibold text-slate-900">
              Save Recording
            </h4>

            <input
              autoFocus
              value={
                recordingName
              }
              onChange={(e) =>
                setRecordingName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter" &&
                  !isConverting
                ) {
                  handleSaveToDevice();
                }
              }}
              placeholder="Enter Recording Name"
              className="
                mt-4 w-full
                border border-slate-300
                rounded-lg px-3 py-2
                outline-none
                focus:ring-2
                focus:ring-indigo-500
              "
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() =>
                  setShowSaveModal(
                    false
                  )
                }
                disabled={
                  isConverting
                }
                className="
                  px-4 py-2 rounded-lg
                  bg-slate-200 hover:bg-slate-300
                  disabled:opacity-50
                  text-slate-900 font-medium
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  handleSaveToDevice
                }
                disabled={
                  isConverting
                }
                className="
                  px-4 py-2 rounded-lg
                  bg-indigo-600 hover:bg-indigo-700
                  disabled:opacity-50
                  text-white font-medium
                "
              >
                {isConverting
                  ? "Converting..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
