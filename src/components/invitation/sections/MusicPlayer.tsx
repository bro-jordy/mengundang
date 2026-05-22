"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";

interface Props {
  url: string;
  title: string;
  opened?: boolean;
}

export function MusicPlayer({ url, title, opened }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
  }, []);

  // Autoplay when invitation is opened (after user click — browser allows it)
  useEffect(() => {
    if (!opened) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [opened]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src={url} preload="none" />
      <button
        onClick={toggle}
        title={playing ? "Pause musik" : "Play musik"}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full shadow-lg transition-all"
        style={{
          background: "rgba(28,25,23,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "10px 16px 10px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Animated note icon */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          {playing && (
            <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          )}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: playing ? "rgba(255,255,255,0.15)" : "transparent" }}
          >
            {playing ? (
              <Pause size={15} className="text-white" />
            ) : (
              <Play size={15} className="text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Song title — only show when playing */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxWidth: playing ? "140px" : "0px", opacity: playing ? 1 : 0 }}
        >
          <div className="flex items-center gap-1.5">
            <Music2 size={11} className="text-white/60 shrink-0 animate-pulse" />
            <span className="text-white text-xs font-medium whitespace-nowrap truncate" style={{ maxWidth: "120px" }}>
              {title}
            </span>
          </div>
        </div>
      </button>
    </>
  );
}
