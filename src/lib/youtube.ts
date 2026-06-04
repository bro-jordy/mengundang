// Helpers for supporting YouTube links as a music source.
// A YouTube URL can't be played by an <audio> tag — it needs the
// YouTube IFrame Player API. These helpers detect such URLs and lazily
// load that API (once per page).

/**
 * Extract the 11-char video id from any common YouTube URL shape:
 *  - https://www.youtube.com/watch?v=ID (with extra &list=, &start_radio=, etc.)
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/embed/ID
 *  - https://www.youtube.com/shorts/ID
 *  - https://music.youtube.com/watch?v=ID
 * Returns null when the URL is not a YouTube link.
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null;
}

type YTNamespace = {
  Player: new (el: Element, opts: unknown) => unknown;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;

/**
 * Load the YouTube IFrame Player API exactly once and resolve when it's ready.
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable on the server"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<YTNamespace>((resolve) => {
    // Chain onto any existing handler so we don't clobber another loader.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT as YTNamespace);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}
