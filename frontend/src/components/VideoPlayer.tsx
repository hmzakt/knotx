"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";

interface VideoPlayerProps {
  hlsUrl: string;
  title?: string;
  onError?: (err: string) => void;
  autoPlay?: boolean;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function VideoPlayer({ hlsUrl, title, onError, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState<"auto" | "720p" | "360p">("auto");
  const [showQuality, setShowQuality] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load HLS
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    const video = videoRef.current;

    const loadHls = async () => {
      // Cleanup previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Native HLS support (Safari)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => {
          if (autoPlay) video.play().catch(() => {});
        });
        return;
      }

      // Dynamic import to avoid SSR issues
      const Hls = (await import("hls.js")).default;
      if (!Hls.isSupported()) {
        onError?.("HLS is not supported in this browser");
        return;
      }

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          onError?.(`Stream error: ${data.type}`);
        }
      });
    };

    loadHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  // Quality switching
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;
    if (quality === "auto") {
      hls.currentLevel = -1; // auto
    } else {
      const levels: any[] = hls.levels || [];
      const idx = levels.findIndex((l: any) =>
        quality === "720p" ? l.height >= 700 : l.height <= 400
      );
      if (idx !== -1) hls.currentLevel = idx;
    }
  }, [quality]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  // Auto-hide controls
  const resetHideTimer = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden select-none group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => { togglePlay(); resetHideTimer(); }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        playsInline
        onClick={(e) => e.stopPropagation()}
      />

      {/* Title overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 pointer-events-none">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 relative"
          onClick={seek}
        >
          {/* Buffer */}
          <div
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${bufferPct}%` }}
          />
          {/* Progress */}
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg -ml-1.5"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-emerald-400 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying
              ? <Pause className="w-5 h-5" fill="currentColor" />
              : <Play className="w-5 h-5" fill="currentColor" />}
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="text-white hover:text-emerald-400 transition-colors"
          >
            {isMuted
              ? <VolumeX className="w-5 h-5" />
              : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Time */}
          <span className="text-white/80 text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Quality picker */}
          <div className="relative">
            <button
              onClick={() => setShowQuality((p) => !p)}
              className="text-white/70 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{quality}</span>
            </button>
            {showQuality && (
              <div className="absolute bottom-8 right-0 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden shadow-xl">
                {(["auto", "720p", "360p"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuality(q); setShowQuality(false); }}
                    className={`block w-full px-4 py-2 text-sm text-left transition-colors ${quality === q ? "bg-emerald-700 text-white" : "text-white/80 hover:bg-neutral-800"}`}
                  >
                    {q === "auto" ? "Auto" : q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-emerald-400 transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Big play button when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}
