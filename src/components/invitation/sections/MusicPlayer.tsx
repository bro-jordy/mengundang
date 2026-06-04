"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { getYouTubeId, loadYouTubeApi } from "@/lib/youtube";

interface Props {
  url: string;
  title: string;
  registerPlay?: (fn: () => void) => void;
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  seekTo: (s: number, allow?: boolean) => void;
  destroy: () => void;
};

export function MusicPlayer({ url, registerPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const pendingPlayRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  const videoId = getYouTubeId(url);
  const isYt = !!videoId;

  useEffect(() => {
    // --- YouTube source: drive a hidden IFrame player via the YT API ---
    if (isYt) {
      let cancelled = false;
      const play = () => {
        const p = ytPlayerRef.current;
        if (p) p.playVideo();
        else pendingPlayRef.current = true; // queue until the player is ready
      };
      registerPlay?.(play);

      loadYouTubeApi().then((YT) => {
        if (cancelled || !ytHostRef.current) return;
        // Let the YT API own its own element so it never fights React's DOM.
        const el = document.createElement("div");
        ytHostRef.current.appendChild(el);
        ytPlayerRef.current = new YT.Player(el, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            loop: 1,
            playlist: videoId, // required for loop to work on a single video
          },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              e.target.setVolume(50);
              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                e.target.playVideo();
              }
            },
            onStateChange: (e: { data: number; target: YTPlayer }) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
              else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
              else if (e.data === YT.PlayerState.ENDED) {
                // Loop fallback in case playlist looping is ignored.
                e.target.seekTo(0);
                e.target.playVideo();
              }
            },
          },
        }) as YTPlayer;
      });

      return () => {
        cancelled = true;
        try {
          ytPlayerRef.current?.destroy();
        } catch {}
        ytPlayerRef.current = null;
        if (ytHostRef.current) ytHostRef.current.innerHTML = "";
      };
    }

    // --- Direct audio source: plain <audio> element ---
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
    registerPlay?.(() => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    });
  }, [url]);

  function toggle() {
    if (isYt) {
      const p = ytPlayerRef.current;
      if (!p) return;
      if (playing) p.pauseVideo();
      else p.playVideo();
      return;
    }
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
      {isYt ? (
        // Hidden, off-screen host for the YouTube iframe (audio only).
        <div
          aria-hidden
          style={{ position: "fixed", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden" }}
        >
          <div ref={ytHostRef} />
        </div>
      ) : (
        <audio ref={audioRef} src={url} preload="auto" />
      )}
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
