"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JackpotMachine, type JackpotPhase } from "./JackpotMachine";

interface Props {
  groomNickname: string;
  brideNickname: string;
  guestName?: string | null;
  invitationLabel: string;
  groomPhoto?: string | null;
  bridePhoto?: string | null;
  primaryColor: string;
  bgColor: string;
  fontHeading: string;
  lang: "EN" | "ID";
  onLangToggle: () => void;
  onOpen: () => void;
}

const COVER_T = {
  EN: {
    dearGuest: "Dear",
    tapToOpen: "Tap to Open Invitation",
    revealing: "Revealing your fortune…",
    jackpotText: "The Ultimate Jackpot",
  },
  ID: {
    dearGuest: "Kepada Yth.",
    tapToOpen: "Buka Undangan",
    revealing: "Mengungkap keberuntungan Anda…",
    jackpotText: "Keberuntungan Terbesar",
  },
};

export function JackpotCover({
  groomNickname,
  brideNickname,
  guestName,
  invitationLabel,
  groomPhoto,
  bridePhoto,
  primaryColor,
  bgColor,
  fontHeading,
  lang,
  onLangToggle,
  onOpen,
}: Props) {
  const [phase, setPhase] = useState<JackpotPhase>("idle");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function at(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
  }

  function handleTap() {
    if (phase !== "idle") return;

    setPhase("spinning");
    at(2600, () => setPhase("result8826"));
    at(5000, () => setPhase("transforming"));
    at(6300, () => setPhase("result888"));
    at(7800, () => setPhase("opening"));
  }

  const gold = primaryColor || "#c9a84c";
  const t = COVER_T[lang];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6"
      animate={phase === "opening" ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={phase === "opening" ? { duration: 0.85, ease: "easeInOut" } : undefined}
      onAnimationComplete={() => {
        if (phase === "opening") onOpen();
      }}
      style={{ backgroundColor: bgColor || "#fdf9f0" }}
    >
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${gold}18 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Top ornament */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-center gap-3 opacity-35">
        <div className="h-px w-14" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
        <span style={{ color: gold, fontSize: 11 }}>✦</span>
        <div className="h-px w-14" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
      </div>

      {/* Language toggle */}
      <div
        className="absolute top-5 right-5 z-10"
        style={{
          display: "flex",
          alignItems: "center",
          background: `${bgColor}dd`,
          border: `1px solid ${gold}33`,
          borderRadius: 99,
          padding: 3,
        }}
      >
        {(["ID", "EN"] as const).map((l) => (
          <button
            key={l}
            onClick={() => { if (l !== lang) onLangToggle(); }}
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              fontFamily: "Georgia, serif",
              padding: "3px 10px",
              borderRadius: 99,
              border: "none",
              cursor: l !== lang ? "pointer" : "default",
              background: lang === l ? gold : "transparent",
              color: lang === l ? "#fff" : `${gold}77`,
              fontWeight: lang === l ? 700 : 400,
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Invitation label */}
        <p
          className="text-xs tracking-[0.28em] uppercase mb-3"
          style={{ color: `${gold}99`, fontFamily: "Georgia, serif" }}
        >
          {invitationLabel}
        </p>

        {/* Couple names */}
        <h1
          className="leading-tight"
          style={{
            fontFamily: `'${fontHeading}', Georgia, serif`,
            fontSize: "2.75rem",
            color: "#2d1f0a",
            marginBottom: 2,
          }}
        >
          {groomNickname || "Groom"}
        </h1>
        <p style={{ color: gold, fontSize: "1.4rem", marginBottom: 2, fontFamily: "Georgia, serif" }}>&amp;</p>
        <h1
          className="leading-tight"
          style={{
            fontFamily: `'${fontHeading}', Georgia, serif`,
            fontSize: "2.75rem",
            color: "#2d1f0a",
            marginBottom: 20,
          }}
        >
          {brideNickname || "Bride"}
        </h1>

        {/* Groom | Machine | Bride row */}
        <div className="flex items-end justify-center gap-3 w-full mb-5">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            style={{
              width: 64,
              height: 96,
              borderRadius: 14,
              overflow: "hidden",
              border: `1.5px solid ${gold}44`,
              background: groomPhoto
                ? undefined
                : "linear-gradient(160deg, #f5e9c2, #eddaa2)",
              flexShrink: 0,
            }}
          >
            {groomPhoto && (
              <img
                src={groomPhoto}
                alt={groomNickname}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            <JackpotMachine phase={phase} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            style={{
              width: 64,
              height: 96,
              borderRadius: 14,
              overflow: "hidden",
              border: `1.5px solid ${gold}44`,
              background: bridePhoto
                ? undefined
                : "linear-gradient(160deg, #f5e9c2, #eddaa2)",
              flexShrink: 0,
            }}
          >
            {bridePhoto && (
              <img
                src={bridePhoto}
                alt={brideNickname}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </motion.div>
        </div>

        {/* Guest name */}
        {guestName && (
          <div className="mb-4 text-center">
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: `${gold}88`, fontFamily: "Georgia, serif" }}
            >
              {t.dearGuest}
            </p>
            <p style={{ color: "#2d1f0a", fontSize: "1.05rem", fontFamily: "Georgia, serif" }}>
              {guestName}
            </p>
          </div>
        )}

        {/* CTA button */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.button
              key="cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              onClick={handleTap}
              style={{
                background: `linear-gradient(135deg, ${gold}, #a87c10)`,
                color: "#fff",
                border: "none",
                borderRadius: 9999,
                padding: "12px 32px",
                fontSize: "0.75rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: `0 4px 20px ${gold}44`,
                fontFamily: "Georgia, serif",
              }}
            >
              {t.tapToOpen}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Spinning hint */}
        <AnimatePresence>
          {phase === "spinning" && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                color: `${gold}77`,
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                fontFamily: "Georgia, serif",
                marginTop: 12,
              }}
            >
              {t.revealing}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Jackpot text */}
        <AnimatePresence>
          {(phase === "result888" || phase === "opening") && (
            <motion.div
              key="jackpot-text"
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="mt-4 text-center"
            >
              <p
                style={{
                  fontFamily: `'${fontHeading}', Georgia, serif`,
                  fontSize: "1.05rem",
                  color: gold,
                  letterSpacing: "0.12em",
                  fontStyle: "italic",
                }}
              >
                ✦ &nbsp;{t.jackpotText}&nbsp; ✦
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom ornament */}
      <div className="absolute bottom-7 left-0 right-0 flex items-center justify-center gap-3 opacity-35">
        <div className="h-px w-14" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
        <span style={{ color: gold, fontSize: 11 }}>✦</span>
        <div className="h-px w-14" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
      </div>
    </motion.div>
  );
}
