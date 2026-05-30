"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface Props {
  url: string;
  title: string;
  registerPlay?: (fn: () => void) => void;
}

export function MusicPlayer({ url, registerPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
    if (registerPlay) {
      registerPlay(() => {
        audio.play().then(() => setPlaying(true)).catch(() => {});
      });
    }
  }, []);

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
      <audio ref={audioRef} src={url} preload="auto" />
      <button
        onClick={toggle}
        title={playing ? "Pause musik" : "Play musik"}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg transition-all flex items-center justify-center"
        style={{
          width: "44px",
          height: "44px",
          background: "rgba(28,25,23,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {playing && (
          <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
        )}
        {playing
          ? <Pause size={16} className="text-white relative z-10" />
          : <Play size={16} className="text-white relative z-10 ml-0.5" />
        }
      </button>
    </>
  );
}
