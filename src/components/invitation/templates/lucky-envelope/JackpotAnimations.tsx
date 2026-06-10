"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

// ─── Shared easing ────────────────────────────────────────────────────────────
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_SOFT = [0.45, 0, 0.55, 1] as const;

// ─── Blur-fade-up section reveal ──────────────────────────────────────────────
export function RevealSection({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.1 });

  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 36 }
      }
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger container ────────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.05 },
  },
};

export const staggerItemVariant = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_OUT_EXPO },
  },
};

interface StaggerWrapProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
}
export function StaggerWrap({ children, className, once = false }: StaggerWrapProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: 0.15 });

  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItemVariant}>
      {children}
    </motion.div>
  );
}

// ─── Parallax Y (scrolls at a fraction of the viewport scroll) ────────────────
export function ParallaxY({
  children,
  speed = 0.25,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const pct = speed * 100;
  const y = useTransform(scrollYProgress, [0, 1], [`-${pct}%`, `${pct}%`]);

  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ""}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// ─── Floating ornamental sparkles ─────────────────────────────────────────────
function Sparkle({
  x,
  y,
  delay,
  color,
  size = 9,
}: {
  x: number;
  y: number;
  delay: number;
  color: string;
  size?: number;
}) {
  return (
    <motion.span
      aria-hidden
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        color,
        fontSize: size,
        opacity: 0,
        userSelect: "none",
        pointerEvents: "none",
      }}
      animate={{ opacity: [0, 0.45, 0], scale: [0.7, 1.3, 0.7], rotate: [0, 20, 0] }}
      transition={{
        duration: 3.8 + delay * 0.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      ✦
    </motion.span>
  );
}

function GlowOrb({
  x,
  y,
  size,
  delay,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity: 0.04,
        pointerEvents: "none",
      }}
      animate={{ y: [0, -18, 0], x: [0, 6, 0], scale: [1, 1.12, 1] }}
      transition={{
        duration: 5 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

export function FloatingOrnaments({ color }: { color: string }) {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2 }}
      aria-hidden
    >
      <Sparkle x={4}  y={12} delay={0}   color={color} />
      <Sparkle x={93} y={18} delay={1.2} color={color} />
      <Sparkle x={7}  y={48} delay={2.5} color={color} size={7} />
      <Sparkle x={90} y={65} delay={0.7} color={color} size={8} />
      <Sparkle x={48} y={88} delay={1.9} color={color} size={7} />
      <Sparkle x={20} y={78} delay={3.1} color={color} size={6} />
      <Sparkle x={75} y={38} delay={1.5} color={color} size={6} />

      <GlowOrb x={-5}  y={10} size={160} delay={0}   color={color} />
      <GlowOrb x={88}  y={40} size={120} delay={1.8} color={color} />
      <GlowOrb x={10}  y={75} size={100} delay={3.0} color={color} />
      <GlowOrb x={80}  y={85} size={140} delay={0.9} color={color} />
    </div>
  );
}

// ─── Ken Burns wrapper (slow zoom on still photo) ─────────────────────────────
export function KenBurns({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        animate={{ scale: [1, 1.07] }}
        transition={{
          duration: 9,
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{ transformOrigin: "center center" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Horizontal slide reveal (for couple cards) ───────────────────────────────
export function SlideReveal({
  children,
  from,
  delay = 0,
  className,
}: {
  children: ReactNode;
  from: "left" | "right";
  delay?: number;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.2 });

  if (shouldReduce) return <div className={className}>{children}</div>;

  const x = from === "left" ? -40 : 40;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x }}
      animate={
        inView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x }
      }
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}
