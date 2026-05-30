"use client";

import { useState, useEffect, useRef } from "react";

type GalleryType = "HERO" | "COVER" | "BACKGROUND" | "PREWEDDING" | "GALLERY";
interface GalleryItem { id: string; url: string; type: GalleryType; sortOrder: number }
interface Props { galleries: GalleryItem[] }

const CARD_W = 260;
const CARD_GAP = 14;
const STEP = CARD_W + CARD_GAP;

export function GallerySection({ galleries }: Props) {
  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");

  const count = photos.length;
  const extended = count > 1 ? [photos[count - 1], ...photos, photos[0]] : photos;

  const [idx, setIdx] = useState(count > 1 ? 1 : 0);
  const [animated, setAnimated] = useState(true);
  // Use pointer events only (covers both mouse and touch; avoids double-fire on mobile)
  const pointerStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!animated) {
      const raf = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [animated]);

  if (photos.length === 0) return null;

  function onTransitionEnd(e: React.TransitionEvent) {
    // Only handle the track's own transform transition, not bubbled child transitions
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    if (count <= 1) return;
    if (idx === 0) { setAnimated(false); setIdx(count); }
    else if (idx === extended.length - 1) { setAnimated(false); setIdx(1); }
  }

  function goNext() { setIdx((i) => i + 1); }
  function goPrev() { setIdx((i) => i - 1); }

  // Pointer events only — handles both touch and mouse without double-firing
  function onPointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
    dragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 5)
      dragging.current = true;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (!dragging.current || Math.abs(dx) < 30) return;
    dx < 0 ? goNext() : goPrev();
  }

  return (
    <section className="py-16">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Momen Bersama</p>
          <h2 className="font-heading text-3xl text-stone-800">Galeri</h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-4" />
        </div>
      </div>

      <div
        style={{ overflow: "hidden", cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            paddingLeft: `calc(50vw - ${CARD_W / 2}px)`,
            paddingRight: `calc(50vw - ${CARD_W / 2}px)`,
            transform: `translateX(-${idx * STEP}px)`,
            transition: animated ? "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((photo, i) => {
            const isCurrent = i === idx;
            return (
              <div
                key={`${photo.id}-${i}`}
                style={{
                  flexShrink: 0,
                  width: `${CARD_W}px`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  pointerEvents: "none",
                  opacity: isCurrent ? 1 : 0.38,
                  transform: isCurrent ? "scale(1)" : "scale(0.85)",
                  boxShadow: isCurrent ? "0 24px 48px rgba(0,0,0,0.13)" : "0 4px 12px rgba(0,0,0,0.05)",
                  transition: animated ? "opacity 400ms ease, transform 400ms ease, box-shadow 400ms ease" : "none",
                }}
              >
                <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
