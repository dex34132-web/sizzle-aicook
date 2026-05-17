import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sizzle:music-muted";
const VOLUME = 0.25;

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactedRef = useRef(false);
  const pausedByVideoRef = useRef(false);
  const pausedByHiddenRef = useRef(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Listen for external toggles (from Settings)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail;
      if (detail && typeof detail.muted === "boolean") setMuted(detail.muted);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMuted(e.newValue === "1");
    };
    window.addEventListener("sizzle:music-toggle", onToggle as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sizzle:music-toggle", onToggle as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Persist mute preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.pause();
    } else if (interactedRef.current && !pausedByVideoRef.current && !pausedByHiddenRef.current) {
      a.play().catch(() => {});
    }
  }, [muted]);

  // Start music after first user interaction
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFirstInteract = () => {
      if (interactedRef.current) return;
      interactedRef.current = true;
      const a = audioRef.current;
      if (a && !muted && !pausedByVideoRef.current) {
        a.volume = VOLUME;
        a.play().catch(() => {});
      }
    };
    const opts: AddEventListenerOptions = { once: false, passive: true };
    window.addEventListener("pointerdown", onFirstInteract, opts);
    window.addEventListener("keydown", onFirstInteract, opts);
    window.addEventListener("touchstart", onFirstInteract, opts);
    return () => {
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("keydown", onFirstInteract);
      window.removeEventListener("touchstart", onFirstInteract);
    };
  }, [muted]);

  // Pause when tab hidden / app closed; resume when visible
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVisibility = () => {
      if (document.hidden) {
        pausedByHiddenRef.current = true;
        audioRef.current?.pause();
      } else {
        pausedByHiddenRef.current = false;
        if (interactedRef.current && !muted && !pausedByVideoRef.current) {
          audioRef.current?.play().catch(() => {});
        }
      }
    };
    const onPageHide = () => {
      audioRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [muted]);

  // Pause music when any <video> plays; resume when paused/ended
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVideoPlay = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "VIDEO") return;
      pausedByVideoRef.current = true;
      audioRef.current?.pause();
    };
    const onVideoStop = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "VIDEO") return;
      // Only resume if no other video is currently playing
      const stillPlaying = Array.from(document.querySelectorAll("video")).some(
        (v) => !v.paused && !v.ended,
      );
      if (stillPlaying) return;
      pausedByVideoRef.current = false;
      if (interactedRef.current && !muted) {
        audioRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener("play", onVideoPlay, true);
    document.addEventListener("pause", onVideoStop, true);
    document.addEventListener("ended", onVideoStop, true);
    return () => {
      document.removeEventListener("play", onVideoPlay, true);
      document.removeEventListener("pause", onVideoStop, true);
      document.removeEventListener("ended", onVideoStop, true);
    };
  }, [muted]);

  return (
    <audio
      ref={audioRef}
      src="/bg-music.mp3"
      loop
      preload="auto"
      aria-hidden="true"
    />
  );
}
