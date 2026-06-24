"use client";

import { motion } from "framer-motion";

export type CharPhase =
  | "idle"
  | "spinning"
  | "result8826"
  | "transforming"
  | "result888"
  | "celebrating"
  | "opening";

function isPressing(p: CharPhase) {
  return p === "spinning" || p === "result8826" || p === "transforming";
}
function isCelebrating(p: CharPhase) {
  return p === "result888" || p === "celebrating";
}

// ─── Man — Black Ao Dai, glasses ──────────────────────────────────────────────

export function ManCharacter({ phase, size = 90 }: { phase: CharPhase; size?: number }) {
  const pressing    = isPressing(phase);
  const celebrating = isCelebrating(phase);
  const normal      = !pressing && !celebrating;

  const SKIN   = "#D4A87A";
  const SKIN_D = "#B89060";
  const HAIR   = "#1A0A0A";
  const TUNIC  = "#1A1A1E";
  const TUNIC2 = "#26262C";
  const PANTS  = "#F0EDE6";
  const SHOE   = "#1A1A1E";
  const GLASS  = "#1A1A1E";
  const MOUTH  = "#8B4030";

  return (
    <motion.div
      style={{ width: size, flexShrink: 0 }}
      animate={
        celebrating ? { y: -14, scale: 1.04 } :
        pressing    ? { y: -4 } :
                      { y: 0, scale: 1.0 }
      }
      transition={{ type: "spring", stiffness: 180, damping: 12 }}
    >
      <svg
        viewBox="0 0 90 280"
        width={size}
        height={Math.round(size * (280 / 90))}
        style={{ overflow: "visible" }}
      >
        {/* ── Shoes ── */}
        <ellipse cx={25} cy={267} rx={21} ry={7} fill={SHOE} />
        <ellipse cx={65} cy={267} rx={21} ry={7} fill={SHOE} />

        {/* ── Wide-leg pants ── */}
        <path d="M 17,212 L 2,260 L 40,268 L 45,230 Z"  fill={PANTS} />
        <path d="M 73,212 L 88,260 L 50,268 L 45,230 Z" fill={PANTS} />
        <path d="M 17,212 L 45,230 L 73,212 Z" fill={PANTS} opacity={0.55} />

        {/* ── GROUP A — Normal arms ── */}
        <g style={{ opacity: normal ? 1 : 0, transition: "opacity 0.22s" }}>
          <path d="M 21,64 L 7,72 L 5,172 L 5,190 L 21,186 L 21,70 Z" fill={TUNIC} />
          <ellipse cx={7}  cy={194} rx={8} ry={6} fill={SKIN} />
          <path d="M 69,64 L 83,72 L 85,172 L 85,190 L 69,186 L 69,70 Z" fill={TUNIC} />
          <ellipse cx={83} cy={194} rx={8} ry={6} fill={SKIN} />
        </g>

        {/* ── GROUP B — Pressing (right arm reaches machine) ── */}
        <g style={{ opacity: pressing ? 1 : 0, transition: "opacity 0.22s" }}>
          <path d="M 21,64 L 7,72 L 5,172 L 5,190 L 21,186 L 21,70 Z" fill={TUNIC} />
          <ellipse cx={7} cy={194} rx={8} ry={6} fill={SKIN} />
          <path d="M 69,64 L 84,70 L 108,92 L 102,108 L 80,94 L 69,70 Z" fill={TUNIC} />
          <ellipse cx={107} cy={113} rx={8} ry={6} fill={SKIN} />
        </g>

        {/* ── GROUP C — Celebrating ── */}
        <g style={{ opacity: celebrating ? 1 : 0, transition: "opacity 0.22s" }}>
          <path d="M 21,64 L 3,50 L -8,28 L 2,18 L 20,36 L 21,62 Z" fill={TUNIC} />
          <ellipse cx={-6} cy={14} rx={8} ry={6} fill={SKIN} />
          <path d="M 69,64 L 87,50 L 98,28 L 88,18 L 70,36 L 69,62 Z" fill={TUNIC} />
          <ellipse cx={96} cy={14} rx={8} ry={6} fill={SKIN} />
        </g>

        {/* ── Ao Dai body ── */}
        <path
          d="M 21,64 C 13,70 12,82 12,94 L 12,212 L 78,212 L 78,94
             C 78,82 77,70 69,64 L 56,54 L 45,60 L 34,54 Z"
          fill={TUNIC}
        />
        {/* side shadow */}
        <path
          d="M 21,64 C 13,70 12,82 12,94 L 12,212 L 22,212 L 22,80 Z"
          fill={TUNIC2} opacity={0.22}
        />

        {/* centre placket + frog buttons */}
        <line x1={45} y1={72} x2={45} y2={198} stroke={TUNIC2} strokeWidth={1.5} opacity={0.4} />
        {[90, 110, 130, 150].map((y, i) => (
          <circle key={i} cx={45} cy={y} r={2.5} fill={TUNIC2} opacity={0.45} />
        ))}

        {/* ── Mandarin collar ── */}
        <path
          d="M 34,54 L 29,42 L 43,38 L 45,48 L 47,38 L 61,42 L 56,54 L 45,60 Z"
          fill={TUNIC}
        />
        <line x1={45} y1={48} x2={45} y2={60} stroke={TUNIC2} strokeWidth={1} opacity={0.35} />

        {/* ── Neck ── */}
        <rect x={41} y={42} width={8} height={16} rx={3} fill={SKIN} />

        {/* ── Hair base ── */}
        <ellipse cx={45} cy={23} rx={21} ry={20} fill={HAIR} />

        {/* ── Face ── */}
        <ellipse cx={45} cy={27} rx={18} ry={21} fill={SKIN} />

        {/* Ears */}
        <ellipse cx={27} cy={27} rx={3.5} ry={4.5} fill={SKIN} />
        <ellipse cx={28} cy={27} rx={2}   ry={3}   fill={SKIN_D} opacity={0.26} />
        <ellipse cx={63} cy={27} rx={3.5} ry={4.5} fill={SKIN} />
        <ellipse cx={62} cy={27} rx={2}   ry={3}   fill={SKIN_D} opacity={0.26} />

        {/* ── Glasses ── */}
        <line x1={30} y1={22} x2={20} y2={26} stroke={GLASS} strokeWidth={1.8} />
        <line x1={60} y1={22} x2={70} y2={26} stroke={GLASS} strokeWidth={1.8} />
        <rect x={30} y={17} width={14} height={10} rx={4.5}
          fill="rgba(0,0,0,0.1)" stroke={GLASS} strokeWidth={2} />
        <rect x={46} y={17} width={14} height={10} rx={4.5}
          fill="rgba(0,0,0,0.1)" stroke={GLASS} strokeWidth={2} />
        <line x1={44} y1={22} x2={46} y2={22} stroke={GLASS} strokeWidth={1.8} />

        {/* ── Eyes ── */}
        <ellipse cx={37} cy={22} rx={3}   ry={2.5} fill="#1A0A0A" />
        <ellipse cx={53} cy={22} rx={3}   ry={2.5} fill="#1A0A0A" />
        <ellipse cx={35.8} cy={21} rx={1.2} ry={1} fill="rgba(255,255,255,0.55)" />
        <ellipse cx={51.8} cy={21} rx={1.2} ry={1} fill="rgba(255,255,255,0.55)" />

        {/* ── Nose ── */}
        <ellipse cx={45} cy={32} rx={2} ry={1.5} fill={SKIN_D} opacity={0.28} />

        {/* ── Mouth ── */}
        <path
          d={celebrating ? "M 37,39 Q 45,45 53,39" : "M 38,39 Q 45,43 52,39"}
          stroke={MOUTH} strokeWidth={2.2} fill="none" strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

// ─── Woman — Dark Red Ao Dai, hair bun ────────────────────────────────────────

export function WomanCharacter({ phase, size = 80 }: { phase: CharPhase; size?: number }) {
  const celebrating = isCelebrating(phase);

  const SKIN   = "#F2CA98";
  const SKIN_D = "#D4A87A";
  const HAIR   = "#1A0A0A";
  const TUNIC  = "#6B1820";
  const TUNIC2 = "#8B2228";
  const PANTS  = "#F0EDE6";
  const SHOE   = "#1A0A0A";
  const BLUSH  = "#E8A090";
  const MOUTH  = "#C4786A";

  return (
    <motion.div
      style={{ width: size, flexShrink: 0 }}
      animate={celebrating ? { y: -10 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.06 }}
    >
      <svg
        viewBox="0 0 80 280"
        width={size}
        height={Math.round(size * (280 / 80))}
        style={{ overflow: "visible" }}
      >
        {/* ── Shoes ── */}
        <ellipse cx={22} cy={270} rx={17} ry={6} fill={SHOE} />
        <ellipse cx={58} cy={270} rx={17} ry={6} fill={SHOE} />

        {/* ── Wide-leg pants ── */}
        <path d="M 15,218 L 3,264 L 36,270 L 40,234 Z"  fill={PANTS} />
        <path d="M 65,218 L 77,264 L 44,270 L 40,234 Z" fill={PANTS} />
        <path d="M 15,218 L 40,234 L 65,218 Z" fill={PANTS} opacity={0.55} />

        {/* ── GROUP A — Normal arms ── */}
        <g style={{ opacity: !celebrating ? 1 : 0, transition: "opacity 0.22s" }}>
          <path d="M 17,56 L 4,64 L 3,158 L 3,174 L 17,170 L 17,62 Z" fill={TUNIC} />
          <ellipse cx={4} cy={177} rx={7} ry={5} fill={SKIN} />
          <path d="M 63,56 L 76,64 L 77,158 L 77,174 L 63,170 L 63,62 Z" fill={TUNIC} />
          <ellipse cx={76} cy={177} rx={7} ry={5} fill={SKIN} />
        </g>

        {/* ── GROUP B — Celebrating arms ── */}
        <g style={{ opacity: celebrating ? 1 : 0, transition: "opacity 0.22s" }}>
          <path d="M 17,56 L 1,44 L -8,22 L 2,14 L 18,30 L 17,54 Z" fill={TUNIC} />
          <ellipse cx={-6} cy={10} rx={7} ry={5} fill={SKIN} />
          <path d="M 63,56 L 79,44 L 88,22 L 78,14 L 62,30 L 63,54 Z" fill={TUNIC} />
          <ellipse cx={86} cy={10} rx={7} ry={5} fill={SKIN} />
        </g>

        {/* ── Ao Dai body (fitted, dark red) ── */}
        <path
          d="M 17,56 C 9,62 8,74 8,86
             C 7,104 11,120 12,138
             C 13,158 11,178 10,198
             L 10,218 L 70,218 L 70,198
             C 69,178 67,158 68,138
             C 69,120 73,104 72,86
             C 72,74 71,62 63,56
             L 51,48 L 40,54 L 29,48 Z"
          fill={TUNIC}
        />
        {/* brocade texture overlay */}
        <path
          d="M 17,56 C 9,62 8,74 8,86
             C 7,104 11,120 12,138
             C 13,158 11,178 10,198
             L 10,218 L 70,218 L 70,198
             C 69,178 67,158 68,138
             C 69,120 73,104 72,86
             C 72,74 71,62 63,56
             L 51,48 L 40,54 L 29,48 Z"
          fill="none"
          stroke={TUNIC2}
          strokeWidth={7}
          strokeDasharray="1.5 5"
          opacity={0.28}
        />
        <line x1={40} y1={62} x2={40} y2={204} stroke={TUNIC2} strokeWidth={1} opacity={0.28} />

        {/* ── Mandarin collar ── */}
        <path d="M 29,48 L 24,36 L 37,32 L 40,42 L 43,32 L 56,36 L 51,48 L 40,54 Z" fill={TUNIC} />
        <path d="M 29,48 L 24,36" stroke={TUNIC2} strokeWidth={1.5} fill="none" />
        <path d="M 51,48 L 56,36" stroke={TUNIC2} strokeWidth={1.5} fill="none" />

        {/* ── Neck ── */}
        <rect x={37} y={36} width={6} height={14} rx={2.5} fill={SKIN} />

        {/* ── Hair bun ── */}
        <ellipse cx={40} cy={6}  rx={12} ry={9}   fill={HAIR} />
        <ellipse cx={40} cy={5}  rx={7}  ry={5}   fill="#2A1212" />
        <ellipse cx={40} cy={9}  rx={12} ry={4.5} fill="none" stroke={HAIR} strokeWidth={2} opacity={0.5} />
        {/* hair pulled back sides */}
        <path d="M 22,22 C 19,14 26,7 34,6 L 34,12 C 27,13 24,18 25,24 Z" fill={HAIR} />
        <path d="M 58,22 C 61,14 54,7 46,6 L 46,12 C 53,13 56,18 55,24 Z" fill={HAIR} />

        {/* ── Face ── */}
        <ellipse cx={40} cy={26} rx={18} ry={21} fill={SKIN} />

        {/* Ears */}
        <ellipse cx={22} cy={26} rx={3} ry={4} fill={SKIN} />
        <ellipse cx={58} cy={26} rx={3} ry={4} fill={SKIN} />

        {/* ── Eyebrows ── */}
        <path d="M 26,16 C 28,14 33,14 36,16"
          stroke={HAIR} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <path d="M 44,16 C 47,14 52,14 54,16"
          stroke={HAIR} strokeWidth={1.8} fill="none" strokeLinecap="round" />

        {/* ── Eyes (almond) ── */}
        <path d="M 25,21 C 27,18 34,18 36,21 C 34,24 27,24 25,21 Z" fill="#1A0A0A" />
        <path d="M 44,21 C 46,18 53,18 55,21 C 53,24 46,24 44,21 Z" fill="#1A0A0A" />
        <ellipse cx={28} cy={20} rx={1.2} ry={1} fill="rgba(255,255,255,0.65)" />
        <ellipse cx={47} cy={20} rx={1.2} ry={1} fill="rgba(255,255,255,0.65)" />

        {/* ── Nose ── */}
        <path d="M 37,29 C 38,31 40,32 42,31 C 41,29 39,28 37,29 Z"
          fill={SKIN_D} opacity={0.28} />

        {/* ── Blush ── */}
        <ellipse cx={26} cy={27} rx={5}   ry={3.5} fill={BLUSH} opacity={0.26} />
        <ellipse cx={54} cy={27} rx={5}   ry={3.5} fill={BLUSH} opacity={0.26} />

        {/* ── Mouth ── */}
        <path
          d={celebrating ? "M 31,35 Q 40,41 49,35" : "M 32,35 Q 40,39 48,35"}
          stroke={MOUTH} strokeWidth={2} fill="none" strokeLinecap="round"
        />
        <ellipse cx={40} cy={36} rx={4} ry={2} fill={MOUTH} opacity={0.2} />
      </svg>
    </motion.div>
  );
}
