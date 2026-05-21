"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export function MusicPlayer({ url, title }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
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
      <audio ref={audioRef} src={url} preload="none" />
      <button
        onClick={toggle}
        title={playing ? "Pause musik" : "Play musik"}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-stone-800 text-white shadow-lg flex items-center justify-center hover:bg-stone-700 transition-colors"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
    </>
  );
}
