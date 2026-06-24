"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JackpotMachine, type JackpotPhase } from "./JackpotMachine";

// ─── Types ────────────────────────────────────────────────────────────────────

type CoverPhase =
  | "idle"
  | "spinning"
  | "result8826"
  | "transforming"
  | "result888"
  | "celebrating"
  | "exiting";

interface Props {
  groomNickname: string;
  brideNickname: string;
  groomPhoto?: string | null;
  bridePhoto?: string | null;
  guestName?: string | null;
  invitationLabel: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  fontHeading: string;
  lang: "ID" | "EN";
  onLangToggle: () => void;
  onOpen: () => void;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const TR = {
  ID: {
    spinBtn:  "Putar Keberuntungan",
    spinning: "Sedang memutar...",
    dear:     "Kepada Yth.",
    tap:      "Ketuk untuk memutar",
  },
  EN: {
    spinBtn:  "Spin Your Fortune",
    spinning: "Spinning...",
    dear:     "Dear",
    tap:      "Tap to spin",
  },
} as const;

// ─── Phase mapping ─────────────────────────────────────────────────────────────

function toMachinePhase(p: CoverPhase): JackpotPhase {
  if (p === "celebrating" || p === "exiting") return "opening";
  return p as JackpotPhase;
}

// ─── Couple photos ─────────────────────────────────────────────────────────────

function CouplePhotos({
  groomPhoto, bridePhoto, groomNickname, brideNickname, gold, phase,
}: {
  groomPhoto?: string | null; bridePhoto?: string | null;
  groomNickname: string; brideNickname: string;
  gold: string; phase: CoverPhase;
}) {
  const celebrating = phase === "celebrating" || phase === "exiting";
  const pressing    = phase === "spinning" || phase === "result8826" || phase === "transforming";

  const SIZE = 72;

  function Photo({ src, name, rotate, zIndex, offsetX, offsetY }: {
    src?: string | null; name: string; rotate: number;
    zIndex: number; offsetX: number; offsetY: number;
  }) {
    return (
      <motion.div
        animate={{
          rotate: celebrating ? rotate * 1.6 : pressing ? rotate * 0.4 : rotate,
          y: celebrating ? -14 : pressing ? -4 : 0,
          x: celebrating ? offsetX * 0.6 : 0,
        }}
        transition={{ type: "spring", stiffness: 160, damping: 11 }}
        style={{ position: "relative", zIndex, flexShrink: 0, originX: "50%", originY: "100%" }}
      >
        <div style={{
          width: SIZE, height: SIZE, borderRadius: "50%", overflow: "hidden",
          border: `2.5px solid ${gold}`,
          boxShadow: celebrating
            ? `0 0 0 4px ${gold}44, 0 8px 24px ${gold}50`
            : `0 4px 16px ${gold}30`,
          transition: "box-shadow 0.4s ease",
        }}>
          {src ? (
            <img
              src={src} alt={name} loading="eager"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${gold}44, ${gold}22)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Georgia, serif", fontSize: "1.6rem", color: gold,
            }}>
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name tag below photo */}
        <p style={{
          position: "absolute", bottom: "-18px", left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Cinzel', serif", fontSize: "0.44rem", letterSpacing: "0.12em",
          textTransform: "uppercase", color: gold, whiteSpace: "nowrap",
          textShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          {name}
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 0, position: "relative" }}>
      {/* Bride — left, leans right toward groom */}
      <Photo
        src={bridePhoto} name={brideNickname}
        rotate={5} zIndex={1} offsetX={-8} offsetY={0}
      />

      {/* Heart ornament */}
      <motion.div
        animate={{ scale: celebrating ? [1, 1.5, 1.2] : 1, opacity: celebrating ? 1 : 0.55 }}
        transition={{ duration: 0.5, times: [0, 0.4, 1] }}
        style={{
          alignSelf: "center", marginBottom: "8px", marginLeft: "-8px", marginRight: "-8px",
          fontSize: "10px", zIndex: 3, lineHeight: 1,
        }}
      >
        🤍
      </motion.div>

      {/* Groom — right, leans left toward bride */}
      <Photo
        src={groomPhoto} name={groomNickname}
        rotate={-5} zIndex={2} offsetX={8} offsetY={0}
      />
    </div>
  );
}

// ─── Confetti particles ───────────────────────────────────────────────────────

function Confetti({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${4 + ((i * 17 + 3) % 92)}%`,
        delay: (i * 0.065) % 0.7,
        color: i % 3 === 0 ? color : i % 3 === 1 ? "#FFD700" : "#FF6B9D",
        size: 6 + (i % 4) * 2,
        round: i % 2 === 0,
      })),
    [color]
  );

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100 }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "108vh", opacity: [1, 0.8, 0], rotate: [0, 270, 540] }}
          transition={{ duration: 2, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute", top: 0, left: p.left,
            width: p.size, height: p.size,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Cover ────────────────────────────────────────────────────────────────────

export function HanoiCover({
  groomNickname,
  brideNickname,
  groomPhoto,
  bridePhoto,
  guestName,
  invitationLabel,
  primaryColor,
  bgColor,
  textColor,
  fontHeading,
  lang,
  onLangToggle,
  onOpen,
}: Props) {
  const [phase, setPhase] = useState<CoverPhase>("idle");
  const t = TR[lang];

  useEffect(() => {
    if (phase === "spinning") {
      const id = setTimeout(() => setPhase("result8826"), 1800);
      return () => clearTimeout(id);
    }
    if (phase === "result8826") {
      const id = setTimeout(() => setPhase("transforming"), 2600);
      return () => clearTimeout(id);
    }
    if (phase === "transforming") {
      const id = setTimeout(() => setPhase("result888"), 600);
      return () => clearTimeout(id);
    }
    if (phase === "result888") {
      const id = setTimeout(() => setPhase("celebrating"), 900);
      return () => clearTimeout(id);
    }
    if (phase === "celebrating") {
      const id = setTimeout(() => {
        setPhase("exiting");
        onOpen();
      }, 1600);
      return () => clearTimeout(id);
    }
  }, [phase, onOpen]);

  const isActive      = phase !== "idle";
  const isSpinning    = phase === "spinning" || phase === "result8826" || phase === "transforming";
  const isCelebrating = phase === "celebrating";

  return (
    <>
      <style>{`
        .hanoi-cover-scene {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          gap: 1.25rem;
          justify-content: center;
          flex-wrap: nowrap;
        }
        @media (max-width: 420px) {
          .hanoi-cover-scene { gap: 0.75rem; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "exiting" ? 0 : 1 }}
        transition={{ duration: 0.75 }}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: bgColor,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "2rem 1.5rem",
          overflow: "hidden",
          pointerEvents: phase === "exiting" ? "none" : "auto",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: "2.25rem" }}
        >
          <p style={{
            fontSize: "0.58rem", letterSpacing: "0.34em", textTransform: "uppercase",
            color: primaryColor, marginBottom: "0.5rem", fontFamily: "'Cinzel', serif",
          }}>
            {invitationLabel}
          </p>
          <h1 style={{
            fontFamily: `'${fontHeading}', 'Cormorant Garamond', Georgia, serif`,
            fontSize: "clamp(1.7rem, 6vw, 2.6rem)", fontWeight: 300,
            color: textColor, lineHeight: 1.12, margin: "0 0 0.5rem",
          }}>
            {brideNickname}{" "}
            <span style={{ color: primaryColor, fontStyle: "italic" }}>&amp;</span>{" "}
            {groomNickname}
          </h1>
          {guestName && (
            <p style={{
              fontSize: "0.76rem", color: textColor, opacity: 0.45,
              fontFamily: `'${fontHeading}', Georgia, serif`, fontStyle: "italic",
            }}>
              {t.dear} {guestName}
            </p>
          )}
        </motion.div>

        {/* Scene: photos + machine (always row, even on mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="hanoi-cover-scene"
          style={{ marginBottom: "3rem" }}
        >
          <CouplePhotos
            groomPhoto={groomPhoto}
            bridePhoto={bridePhoto}
            groomNickname={groomNickname}
            brideNickname={brideNickname}
            gold={primaryColor}
            phase={phase}
          />

          <div style={{ flexShrink: 0 }}>
            <JackpotMachine phase={toMachinePhase(phase)} />
          </div>
        </motion.div>

        {/* Action area */}
        <div style={{ height: "3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {!isActive && (
              <motion.button
                key="spin-btn"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
                transition={{ delay: 1.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.04, boxShadow: `0 12px 36px ${primaryColor}50` }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPhase("spinning")}
                style={{
                  padding: "0.9rem 2.6rem",
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}BB)`,
                  color: "#fff", border: "none", borderRadius: "9999px",
                  fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.24em",
                  textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "'Cinzel', serif",
                  boxShadow: `0 6px 24px ${primaryColor}40`,
                }}
              >
                {t.spinBtn}
              </motion.button>
            )}

            {isSpinning && (
              <motion.p
                key="spinning-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  fontFamily: "'Cinzel', serif", fontSize: "0.62rem",
                  letterSpacing: "0.3em", color: primaryColor, textTransform: "uppercase",
                }}
              >
                {t.spinning}
              </motion.p>
            )}

            {isCelebrating && (
              <motion.p
                key="celebrate-text"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  fontFamily: `'${fontHeading}', Georgia, serif`,
                  fontSize: "1.1rem", color: primaryColor, fontStyle: "italic",
                }}
              >
                ✦ 8 8 8 ✦
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>{isCelebrating && <Confetti color={primaryColor} />}</AnimatePresence>

        {/* Language toggle */}
        <div style={{
          position: "absolute", bottom: "1.5rem", right: "1.5rem",
          display: "flex", borderRadius: "9999px", overflow: "hidden",
          border: `1px solid ${primaryColor}44`,
        }}>
          {(["ID", "EN"] as const).map((l) => (
            <button
              key={l}
              onClick={onLangToggle}
              style={{
                padding: "0.38rem 0.7rem", fontSize: "0.6rem",
                fontFamily: "'Cinzel', serif", letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: lang === l ? primaryColor : "transparent",
                color: lang === l ? "#fff" : primaryColor,
                border: "none", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Tap hint */}
        {!isActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ delay: 2.5, duration: 2.5, repeat: Infinity }}
            style={{
              position: "absolute", bottom: "1.5rem", left: "50%",
              transform: "translateX(-50%)",
              fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: textColor, fontFamily: "'Cinzel', serif", whiteSpace: "nowrap",
            }}
          >
            {t.tap}
          </motion.p>
        )}
      </motion.div>
    </>
  );
}
