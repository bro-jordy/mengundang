"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type JackpotPhase =
  | "idle"
  | "spinning"
  | "result8826"
  | "transforming"
  | "result888"
  | "opening";

const TARGETS = [8, 8, 2, 6];
const IDLE_OFFSETS = [0, 4, 7, 2];

interface ReelProps {
  digit: number;
  glow: boolean;
  exited: boolean;
  justLocked: boolean;
  mergingOut: boolean;
  justMergedPop: boolean;
}

function Reel({ digit, glow, exited, justLocked, mergingOut, justMergedPop }: ReelProps) {
  return (
    <motion.div
      animate={
        exited
          ? { width: 0, opacity: 0, marginRight: -8, scaleX: 0 }
          : { width: 44, opacity: 1, marginRight: 0, scaleX: 1 }
      }
      transition={{ duration: 0.45, ease: "easeInOut" }}
      style={{ overflow: "hidden", flexShrink: 0, originX: "center" }}
    >
      <motion.div
        animate={{
          borderColor: glow ? "#d4a843" : "#c9b87a",
          boxShadow: glow
            ? "0 0 22px rgba(212,168,67,0.9), 0 0 8px rgba(212,168,67,0.5)"
            : "inset 0 1px 3px rgba(0,0,0,0.08)",
          background: glow
            ? "linear-gradient(135deg, #fffbe8, #fff5c4)"
            : "linear-gradient(135deg, #fef9ed, #fdf3d0)",
        }}
        transition={{ duration: 0.35 }}
        style={{
          width: 44,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          border: "2px solid #c9b87a",
        }}
      >
        <motion.span
          key={justLocked ? `locked-${digit}` : justMergedPop ? `merged-${digit}` : "spinning"}
          initial={
            justLocked ? { y: -14, opacity: 0 } :
            justMergedPop ? { scale: 1.6, opacity: 0 } :
            false
          }
          animate={
            mergingOut
              ? { scale: 0.15, opacity: 0 }
              : { y: 0, opacity: 1, x: 0, scale: 1 }
          }
          transition={{
            duration: mergingOut ? 0.18 : justMergedPop ? 0.32 : justLocked ? 0.22 : 0,
          }}
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1.65rem",
            fontWeight: "bold",
            lineHeight: 1,
            color: glow ? "#7a5a08" : "#2d1f0a",
            textShadow: glow ? "0 0 12px rgba(212,168,67,0.9)" : "none",
            display: "block",
            userSelect: "none",
          }}
        >
          {digit}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

interface Props {
  phase: JackpotPhase;
}

export function JackpotMachine({ phase }: Props) {
  const [digits, setDigits] = useState<number[]>([...IDLE_OFFSETS]);
  const [locked, setLocked] = useState([false, false, false, false]);
  const [glowing, setGlowing] = useState([false, false, false, false]);
  const [exited, setExited] = useState([false, false, false, false]);
  const [mergingOut, setMergingOut] = useState([false, false, false, false]);
  const [justMergedPop, setJustMergedPop] = useState([false, false, false, false]);
  const [cx2, setCx2] = useState(0);
  const [cx3, setCx3] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef([false, false, false, false]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDigits((prev) =>
        prev.map((d, i) => (lockedRef.current[i] ? d : (d + 1) % 10))
      );
    }, 75);
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function at(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
  }

  useEffect(() => {
    if (phase === "idle") {
      stopInterval();
      clearTimeouts();
      lockedRef.current = [false, false, false, false];
      setDigits([...IDLE_OFFSETS]);
      setLocked([false, false, false, false]);
      setGlowing([false, false, false, false]);
      setExited([false, false, false, false]);
      setMergingOut([false, false, false, false]);
      setJustMergedPop([false, false, false, false]);
      setCx2(0);
      setCx3(0);
      startInterval();
      return stopInterval;
    }

    if (phase === "spinning") {
      lockedRef.current = [false, false, false, false];
      setLocked([false, false, false, false]);
      setMergingOut([false, false, false, false]);
      setJustMergedPop([false, false, false, false]);
      setCx2(0);
      setCx3(0);
      startInterval();
      return stopInterval;
    }

    if (phase === "result8826") {
      startInterval();

      TARGETS.forEach((target, i) => {
        at(i * 520, () => {
          lockedRef.current[i] = true;
          setLocked((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
          setDigits((prev) => {
            const next = [...prev];
            next[i] = target;
            return next;
          });
        });
      });

      return () => {
        stopInterval();
        clearTimeouts();
      };
    }

    if (phase === "transforming") {
      setGlowing([false, false, true, true]);
      return;
    }

    if (phase === "result888") {
      setGlowing([false, false, false, false]);
      setCx2(15);
      setCx3(-15);
      at(130, () => {
        setMergingOut([false, false, true, true]);
      });
      at(290, () => {
        setDigits((prev) => {
          const next = [...prev];
          next[2] = 8;
          return next;
        });
        setJustMergedPop([false, false, true, false]);
        setGlowing([false, false, true, false]);
        setMergingOut([false, false, false, false]);
        setCx2(0);
      });
      at(460, () => {
        setExited([false, false, false, true]);
        setGlowing([false, false, false, false]);
      });
      return () => clearTimeouts();
    }

    if (phase === "opening") {
      stopInterval();
      clearTimeouts();
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      stopInterval();
      clearTimeouts();
    },
    []
  );

  const isLit = phase !== "idle";

  return (
    <motion.div
      animate={{
        boxShadow: isLit
          ? "0 0 36px rgba(212,168,67,0.22), 0 8px 28px rgba(0,0,0,0.12)"
          : "0 4px 14px rgba(0,0,0,0.08)",
      }}
      transition={{ duration: 0.9 }}
      style={{
        background: "linear-gradient(160deg, #f8e9be, #edda9a, #f8e9be)",
        border: "2px solid #c9a84c",
        borderRadius: 20,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        minWidth: 180,
      }}
    >
      <motion.p
        animate={{ opacity: isLit ? 1 : 0.5 }}
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#8b6914",
          margin: 0,
        }}
      >
        ✦ &nbsp;Fortune&nbsp; ✦
      </motion.p>

      <div
        style={{
          background: "rgba(255,255,255,0.28)",
          border: "1px solid rgba(201,168,76,0.38)",
          borderRadius: 13,
          padding: "9px 11px",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {[0, 1].map((i) => (
          <Reel
            key={i}
            digit={digits[i]}
            glow={glowing[i]}
            exited={exited[i]}
            justLocked={locked[i]}
            mergingOut={mergingOut[i]}
            justMergedPop={justMergedPop[i]}
          />
        ))}

        <motion.div
          animate={{ x: cx2 }}
          transition={
            cx2 !== 0
              ? { duration: 0.14, ease: [0.4, 0, 1, 1] }
              : { type: "spring", stiffness: 600, damping: 28 }
          }
          style={{ flexShrink: 0 }}
        >
          <Reel
            digit={digits[2]}
            glow={glowing[2]}
            exited={exited[2]}
            justLocked={locked[2]}
            mergingOut={mergingOut[2]}
            justMergedPop={justMergedPop[2]}
          />
        </motion.div>

        <motion.div
          animate={{
            opacity: phase === "transforming" ? 1 : 0,
            width: phase === "transforming" ? 18 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden", flexShrink: 0, marginLeft: -4, marginRight: -4, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "bold", color: "#8b6914", userSelect: "none" }}>+</span>
        </motion.div>

        <motion.div
          animate={{ x: cx3 }}
          transition={{ duration: 0.14, ease: [0.4, 0, 1, 1] }}
          style={{ flexShrink: 0 }}
        >
          <Reel
            digit={digits[3]}
            glow={glowing[3]}
            exited={exited[3]}
            justLocked={locked[3]}
            mergingOut={mergingOut[3]}
            justMergedPop={justMergedPop[3]}
          />
        </motion.div>
      </div>

      <motion.div
        animate={{
          background: isLit
            ? "linear-gradient(90deg, transparent, #d4a843, transparent)"
            : "linear-gradient(90deg, transparent, rgba(201,168,76,0.22), transparent)",
        }}
        style={{ width: "100%", height: 2, borderRadius: 1 }}
      />
    </motion.div>
  );
}
