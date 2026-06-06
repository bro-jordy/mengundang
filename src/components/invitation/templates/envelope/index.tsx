"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  MapPin,
  Clock,
  Calendar,
  Copy,
  Check,
  Wallet,
  QrCode,
  Gift,
  Send,
  Heart,
  LockKeyhole,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventLabel } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import type { Rsvp } from "@/types/prisma.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function storyToHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (s.includes("<")) return s;
  return s.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

function useCountdown(target: Date | null) {
  type T = { days: number; hours: number; minutes: number; seconds: number };
  const targetMs = target?.getTime() ?? null;
  const [t, setT] = useState<T | null>(null);
  useEffect(() => {
    if (targetMs === null) return;
    function calc() {
      const diff = targetMs! - Date.now();
      if (diff <= 0) { setT(null); return; }
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60) });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return targetMs !== null ? t : null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: "GEREJA_SAJA" | "GEREJA_RESEPSI";
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

type Profile = {
  groomName: string;
  brideName: string;
  groomNickname: string;
  brideNickname: string;
  groomParents: string;
  brideParents: string;
  openingQuote: string | null;
  openingQuoteBy: string | null;
  story: string | null;
  storyTitle: string | null;
  showStoryTitle: boolean;
  heroImage: string | null;
  groomPhoto: string | null;
  bridePhoto: string | null;
  showGroomPhoto: boolean;
  showBridePhoto: boolean;
  attentionTitle: string | null;
  attentionContent: string | null;
} | null;

interface Props {
  guest: Guest | null;
  client: {
    id: string;
    name: string;
    slug: string;
    clientType: string;
    weddingProfile: Profile;
    events: {
      id: string;
      type: string;
      label: string;
      date: Date | null;
      timeStart: string;
      timeEnd: string;
      venueName: string;
      venueAddress: string;
      mapsUrl: string;
    }[];
    musics: { url: string; title: string }[];
    sections: { sectionKey: string; sortOrder: number }[];
    galleries: { id: string; url: string; type: string; sortOrder: number }[];
    gifts: {
      id: string;
      bankName: string | null;
      accountNumber: string | null;
      accountName: string | null;
      ewalletType: string | null;
      ewalletNumber: string | null;
      qrisImage: string | null;
      isActive: boolean;
    }[];
    wishes: {
      id: string;
      name: string;
      message: string;
      reply: string | null;
      createdAt: Date;
    }[];
    theme: {
      primaryColor: string;
      secondaryColor: string;
      bgColor: string;
      textColor: string;
      fontHeading: string;
      fontBody: string;
      showCountdown?: boolean | null;
      showMap?: boolean | null;
      barcodeVisibility?: string | null;
    } | null;
  };
  token: string | null;
}

// ─── Translations ────────────────────────────────────────────────────────────

const TR = {
  id: {
    kepada: "Dear.",
    scroll: "scroll",
    // Couple
    eyebrow_couple: "Mempelai", title_couple: "Dua Hati, Satu Tujuan",
    ourStory: "Kisah Kami",
    // Countdown
    countdownLabel: "Menuju Hari Bahagia",
    days: "Hari", hours: "Jam", minutes: "Menit", seconds: "Detik",
    // Events
    eyebrow_event: "Jadwal", title_event: "Detail Acara",
    viewLocation: "Lihat Lokasi", timezone: "WIB",
    // Gallery
    eyebrow_gallery: "Momen", title_gallery: "Galeri Kenangan",
    // RSVP
    eyebrow_rsvp: "Konfirmasi", title_rsvp: "RSVP",
    attending: "Hadir", notAttending: "Tidak Hadir",
    guestCount: "Jumlah Tamu", max: "maks.",
    messagePlaceholder: "Pesan atau doa (opsional)",
    confirmBtn: "Konfirmasi Kehadiran", sending: "Mengirim...",
    thankYou: "Terima kasih!", confirmed: "Konfirmasi kehadiran telah diterima",
    rsvpLocked: "RSVP tersedia melalui link undangan personal.",
    // Wishes
    eyebrow_wishes: "Pesan", title_wishes: "Ucapan & Doa",
    yourName: "Nama Anda", wishPlaceholder: "Tulis doa dan ucapan terbaik...",
    sendWish: "Kirim Ucapan", sent: "Terkirim ✓",
    beFirst: "Jadilah yang pertama memberikan ucapan...", reply: "Balasan",
    // Gift
    eyebrow_gift: "Hadiah", title_gift: "Amplop Digital",
    giftNote: "Doa restu Anda adalah hadiah terbaik yang kami harapkan.",
    transferLabel: "Transfer", accountName: "Atas Nama",
    copy: "Salin", copied: "Tersalin",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "Lihat QR", closeQr: "Tutup", scanToTransfer: "Scan untuk transfer",
    giftThanks: "Terima kasih atas perhatian dan kasih sayang Anda",
    // Closing
    withLove: "With Love", forever: "Forever & Always",
    madeWith: "Made with love",
  },
  en: {
    kepada: "Dear",
    scroll: "scroll",
    // Couple
    eyebrow_couple: "The Couple", title_couple: "Two Hearts, One Journey",
    ourStory: "Our Story",
    // Countdown
    countdownLabel: "Counting Down to Our Day",
    days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs",
    // Events
    eyebrow_event: "Schedule", title_event: "Event Details",
    viewLocation: "View Location", timezone: "WIB",
    // Gallery
    eyebrow_gallery: "Moments", title_gallery: "Gallery",
    // RSVP
    eyebrow_rsvp: "Confirmation", title_rsvp: "RSVP",
    attending: "Attending", notAttending: "Not Attending",
    guestCount: "Number of Guests", max: "max.",
    messagePlaceholder: "Message or prayer (optional)",
    confirmBtn: "Confirm Attendance", sending: "Sending...",
    thankYou: "Thank you!", confirmed: "Your attendance has been confirmed",
    rsvpLocked: "RSVP is available via your personal invitation link.",
    // Wishes
    eyebrow_wishes: "Messages", title_wishes: "Wishes & Prayers",
    yourName: "Your Name", wishPlaceholder: "Write your wishes and prayers...",
    sendWish: "Send Wishes", sent: "Sent ✓",
    beFirst: "Be the first to leave a wish...", reply: "Reply",
    // Gift
    eyebrow_gift: "Gift", title_gift: "Digital Gift",
    giftNote: "Your blessings are the greatest gift we could ask for.",
    transferLabel: "Transfer", accountName: "Account Name",
    copy: "Copy", copied: "Copied",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "View QR", closeQr: "Close", scanToTransfer: "Scan to transfer",
    giftThanks: "Thank you for your love and generosity",
    // Closing
    withLove: "With Love", forever: "Forever & Always",
    madeWith: "Made with love",
  },
} as const;

type Lang = keyof typeof TR;
type Translations = (typeof TR)[Lang];

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  AKAD: "Akad",
  PEMBERKATAN: "Church Ceremony",
  RESEPSI: "Reception",
  AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit",
  LAMARAN: "Engagement Ceremony",
};

const INVITATION_LABEL: Record<string, string> = {
  WEDDING: "The Wedding Of",
  SANGJIT: "Sangjit Ceremony Of",
  LAMARAN: "Lamaran",
};

const BANK_GRADIENTS: Record<string, [string, string]> = {
  BCA: ["#005bac", "#1a8fe0"],
  BNI: ["#e65c00", "#f9a825"],
  MANDIRI: ["#003087", "#0057e0"],
  BRI: ["#003087", "#1a5276"],
  CIMB: ["#b71c1c", "#e53935"],
};

// ─── Default palette ──────────────────────────────────────────────────────────

const DEF = {
  gold: "#c4954a",
  goldLight: "#ddb96e",
  ivory: "#faf8f4",
  champagne: "#f4ece0",
  blush: "#f5ebe4",
  text: "#332820",
  muted: "#7a6355",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap');

  html {
    scroll-behavior: smooth;
  }

  .env-root, .env-root *, .env-root *::before, .env-root *::after {
    box-sizing: border-box;
  }

  .env-root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }


  @keyframes env-drift {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%        { transform: translateY(-8px) rotate(0.5deg); }
    66%        { transform: translateY(-4px) rotate(-0.3deg); }
  }

  @keyframes env-particle-float {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 0.5; }
    100% { transform: translateY(-130px) translateX(var(--pdx, 0px)); opacity: 0; }
  }

  @keyframes env-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  @keyframes env-pulse {
    0%   { transform: scale(0.9); opacity: 0.7; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  .env-gold-shimmer {
    background: linear-gradient(90deg, #a87830 0%, #ddb96e 40%, #c4954a 50%, #ddb96e 60%, #a87830 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: env-shimmer 5s linear infinite;
  }

  .env-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--env-gold, #c4954a), transparent);
    margin: 0 auto;
  }

  .story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
  .story-html li { margin: 0.15em 0; }
  .story-html strong, .story-html b { font-weight: 600; }
  .story-html em, .story-html i { font-style: italic; }
  .story-html p { margin: 0.4em 0; }
  .story-html p:first-child { margin-top: 0; }
  .story-html p:last-child { margin-bottom: 0; }
`;

// ─── Animation variants (GPU-only: transform + opacity) ─────────────────────

type VariantName = "fadeUp" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight";

const EASE = [0.22, 1, 0.36, 1] as const;
// Exit instantly (duration 0) — no competing animations while scrolling
const EXIT: Variants[string] = { transition: { duration: 0 } };

const VARIANTS: Record<VariantName, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24, ...EXIT },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  },
  fadeIn: {
    hidden: { opacity: 0, ...EXIT },
    visible: { opacity: 1, transition: { duration: 0.75, ease: "easeOut" } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95, ...EXIT },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: EASE } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -22, ...EXIT },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 22, ...EXIT },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
  },
};

// ─── AnimInView — whileInView (no React state, no re-renders on scroll) ──────
// Uses framer-motion's internal IntersectionObserver → 60fps smooth

function AnimInView({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
  style,
  amount = 0.12,
}: {
  children: React.ReactNode;
  variant?: VariantName;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  amount?: number;
}) {
  const v = VARIANTS[variant];
  const patchedV = delay
    ? {
        ...v,
        visible: {
          ...(v.visible as object),
          transition: { ...((v.visible as { transition?: Record<string, unknown> }).transition ?? {}), delay },
        },
      }
    : v;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount, margin: "0px 0px -40px 0px" }}
      variants={patchedV}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Ambient particles ────────────────────────────────────────────────────────

function Particles() {
  const items = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 41 + 7) % 88)}%`,
        size: 2 + (i % 3),
        delay: (i * 0.43) % 7,
        dur: 4.5 + (i * 0.57) % 4,
        dx: `${-18 + ((i * 19) % 36)}px`,
        opacity: 0.18 + (i % 5) * 0.05,
        bottom: `${10 + (i * 11) % 35}%`,
      })),
    []
  );

  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
    >
      {items.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            bottom: p.bottom,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: DEF.gold,
            opacity: p.opacity,
            animation: `env-particle-float ${p.dur}s ${p.delay}s ease-in-out infinite`,
            "--pdx": p.dx,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({
  eyebrow,
  title,
  gold,
  text,
  fontH,
  center = true,
}: {
  eyebrow: string;
  title: string;
  gold: string;
  text: string;
  fontH: string;
  center?: boolean;
}) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: "2.5rem" }}>
      <AnimInView variant="fadeIn">
        <p
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: gold,
            fontFamily: "'Cinzel', serif",
            marginBottom: "0.6rem",
          }}
        >
          {eyebrow}
        </p>
      </AnimInView>
      <AnimInView variant="fadeUp" delay={0.08}>
        <div style={{ overflow: "hidden", display: "inline-block" }}>
          <p
            style={{
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
              fontWeight: 300,
              color: text,
              lineHeight: 1.15,
            }}
          >
            {title}
          </p>
        </div>
      </AnimInView>
      <AnimInView variant="fadeIn" delay={0.2}>
        <div
          className="env-divider"
          style={{
            width: "52px",
            margin: center ? "1rem auto 0" : "1rem 0 0",
            "--env-gold": gold,
          } as React.CSSProperties}
        />
      </AnimInView>
    </div>
  );
}

// ─── Wax seal ──────────────────────────────────────────────────────────────────

function WaxSeal({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 38% 35%, #d4a843, #9e6d26, #7a5220)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 7,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      />
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: size * 0.28,
          color: "rgba(255,255,255,0.8)",
          userSelect: "none",
          letterSpacing: 1,
        }}
      >
        ✦
      </span>
    </div>
  );
}

// ─── The Envelope Opening ─────────────────────────────────────────────────────

interface EnvelopeOpeningProps {
  onComplete: () => void;
  guestName: string | null;
  groomNick: string;
  brideNick: string;
  heroImage: string | null;
  gold: string;
  fontH: string;
  invLabel: string;
  t: Translations;
}

function EnvelopeOpening({
  onComplete,
  guestName,
  groomNick,
  brideNick,
  heroImage,
  gold,
  fontH,
  invLabel,
  t,
}: EnvelopeOpeningProps) {
  const [phase, setPhase] = useState<"idle" | "opening" | "zooming">("idle");

  const overlayControls = useAnimation();
  const envelopeControls = useAnimation();
  const flapControls = useAnimation();
  const cardControls = useAnimation();
  const sealControls = useAnimation();

  const handleOpen = useCallback(async () => {
    if (phase !== "idle") return;
    setPhase("opening");

    // 1. Wax seal fades
    sealControls.start({
      opacity: 0,
      scale: 0.65,
      transition: { duration: 0.28, ease: "easeIn" },
    });

    // 2. Flap rotates backward — perspective is on parent, origin = top
    await flapControls.start({
      rotateX: -92,
      transition: { duration: 1.05, ease: [0.43, 0.13, 0.23, 0.96] },
    });

    // 3. Card slides upward
    await cardControls.start({
      y: -56,
      opacity: 1,
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    });

    // 4. Brief appreciation pause
    await new Promise((r) => setTimeout(r, 380));

    setPhase("zooming");

    // 5. Cinematic zoom into the invitation card
    await envelopeControls.start({
      scale: 7,
      opacity: 0,
      transition: { duration: 0.85, ease: [0.43, 0.13, 0.23, 0.96] },
    });

    // 6. Fade overlay out
    await overlayControls.start({
      opacity: 0,
      transition: { duration: 0.32, ease: "easeIn" },
    });

    onComplete();
  }, [phase, sealControls, flapControls, cardControls, envelopeControls, overlayControls, onComplete]);

  return (
    <motion.div
      animate={overlayControls}
      className="env-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 38%, #f8f0e2 0%, #ede0c6 45%, #dfd1b3 100%)",
        overflow: "hidden",
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <Particles />

      {/* Subtle paper grain */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundSize: "300px",
          pointerEvents: "none",
        }}
      />

      {/* Guest greeting */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.9 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            style={{
              position: "absolute",
              top: "10%",
              left: 0,
              right: 0,
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            {guestName && (
              <>
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: DEF.muted,
                    marginBottom: "0.4rem",
                  }}
                >
                  {t.kepada}
                </p>
                <p
                  style={{
                    fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                    fontSize: "clamp(1.1rem, 4vw, 1.5rem)",
                    fontWeight: 400,
                    color: DEF.text,
                    lineHeight: 1.3,
                  }}
                >
                  {guestName}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KETUK UNTUK MEMBUKA hint — above the envelope, idle only */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            key="open-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.9, duration: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            style={{
              position: "absolute",
              bottom: "calc(50% + min(117px, 30.25vw) + 18px)",
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.6rem",
                letterSpacing: "0.3em",
                color: gold,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.65rem",
              }}
            >
              <Heart size={9} fill={gold} strokeWidth={0} />
              TAP TO OPEN
              <Heart size={9} fill={gold} strokeWidth={0} />
            </p>
            <motion.p
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ marginTop: "0.45rem", color: gold, fontSize: "1rem", lineHeight: 1 }}
            >
              ↓
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Envelope — perspective wrapper */}
      <motion.div
        animate={envelopeControls}
        style={{ position: "relative", zIndex: 20, transformOrigin: "center center" }}
      >
        <div
          style={{
            perspective: "920px",
            perspectiveOrigin: "50% 38%",
            animation: phase === "idle" ? "env-drift 5s ease-in-out infinite" : "none",
          }}
        >
          {/* Envelope body container */}
          <div
            style={{
              position: "relative",
              width: "min(340px, 88vw)",
              height: "min(234px, 60.5vw)",
              cursor: phase === "idle" ? "pointer" : "default",
            }}
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            aria-label="Open invitation"
            onKeyDown={(e) => e.key === "Enter" && handleOpen()}
          >
            {/* Envelope background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "3px",
                background: "linear-gradient(155deg, #f4e9d3 0%, #e9d9b8 100%)",
                boxShadow:
                  "0 22px 72px rgba(61,40,20,0.24), 0 6px 20px rgba(61,40,20,0.14), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            />

            {/* Left fold */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: "polygon(0 0, 50% 50%, 0 100%)",
                background: "linear-gradient(135deg, #e3d4b2 0%, #d8c8a0 100%)",
                opacity: 0.75,
              }}
            />

            {/* Right fold */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: "polygon(100% 0, 50% 50%, 100% 100%)",
                background: "linear-gradient(225deg, #e6d6b4 0%, #dbc9a2 100%)",
                opacity: 0.75,
              }}
            />

            {/* Bottom fold */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: "polygon(0 100%, 50% 50%, 100% 100%)",
                background: "linear-gradient(to top, #d8c89a 0%, #e6d9b8 100%)",
                opacity: 0.85,
              }}
            />

            {/* Invitation card — peeks from below flap */}
            <motion.div
              animate={cardControls}
              initial={{ y: 24, opacity: 0.7 }}
              style={{
                position: "absolute",
                left: "9%",
                bottom: "9%",
                width: "82%",
                height: "76%",
                background: "#fff",
                borderRadius: "2px",
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
              }}
            >
              {heroImage && (
                <img
                  src={heroImage}
                  alt=""
                  loading="eager"
                  decoding="async"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.35,
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  padding: "0 10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "clamp(0.52rem, 1.7vw, 0.72rem)",
                    letterSpacing: "0.22em",
                    color: gold,
                    textTransform: "uppercase",
                    marginBottom: "0.35rem",
                  }}
                >
                  {invLabel}
                </p>
                <div
                  style={{
                    height: "1px",
                    width: "36px",
                    background: `linear-gradient(to right, transparent, ${gold}, transparent)`,
                    margin: "0.35rem auto",
                  }}
                />
                <p
                  style={{
                    fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                    fontSize: "clamp(1.05rem, 3.8vw, 1.45rem)",
                    fontWeight: 300,
                    color: DEF.text,
                    lineHeight: 1.2,
                  }}
                >
                  {groomNick} & {brideNick}
                </p>
              </div>
            </motion.div>

            {/* Top flap — V-shape, rotates backward */}
            <motion.div
              animate={flapControls}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "56%",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                background: "linear-gradient(to bottom, #f6eedb 0%, #e8d7b4 100%)",
                transformOrigin: "top center",
                zIndex: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "8%",
              }}
            >
              {/* Wax seal centered on flap — ring pulses to signal clickability */}
              <motion.div animate={sealControls} style={{ position: "relative" }}>
                {/* Radiating dash lines around the seal — disabled for now
                <div
                  aria-hidden
                  style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0, pointerEvents: "none" }}
                >
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <div
                      key={deg}
                      style={{
                        position: "absolute",
                        top: "-1.5px",
                        left: 0,
                        width: "10px",
                        height: "3px",
                        background: gold,
                        borderRadius: "2px",
                        transformOrigin: "left center",
                        transform: `rotate(${deg}deg) translateX(34px)`,
                        opacity: 0.72,
                      }}
                    />
                  ))}
                </div>
                */}
                <WaxSeal size={42} />
                {/* Pulsing ring */}
                <motion.div
                  animate={{ scale: [0.88, 1.55], opacity: [0.65, 0] }}
                  transition={{ repeat: Infinity, duration: 1.9, ease: "easeOut", repeatDelay: 0.3 }}
                  style={{
                    position: "absolute",
                    inset: -7,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(196, 149, 74, 0.7)",
                    pointerEvents: "none",
                  }}
                />
                {/* Second ring offset for depth */}
                <motion.div
                  animate={{ scale: [0.88, 1.55], opacity: [0.35, 0] }}
                  transition={{ repeat: Infinity, duration: 1.9, ease: "easeOut", repeatDelay: 0.3, delay: 0.55 }}
                  style={{
                    position: "absolute",
                    inset: -7,
                    borderRadius: "50%",
                    border: "1px solid rgba(196, 149, 74, 0.5)",
                    pointerEvents: "none",
                  }}
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  heroUrl,
  gold,
  ivory,
  text,
  fontH,
  coupleLabel,
  invLabel,
  t,
}: {
  heroUrl?: string;
  gold: string;
  ivory: string;
  text: string;
  fontH: string;
  coupleLabel: string;
  invLabel: string;
  t: Translations;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <section
      ref={ref}
      style={{ position: "relative", height: "100dvh", overflow: "hidden" }}
    >
      {/* Parallax background */}
      <motion.div
        style={{ y, position: "absolute", inset: "-12%" }}
      >
        {heroUrl ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url('${heroUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center 30%",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(250,248,244,0.12) 0%, rgba(51,40,32,0.5) 60%, rgba(51,40,32,0.82) 100%)",
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(145deg, ${ivory} 0%, #e9ddd0 100%)`,
            }}
          />
        )}
      </motion.div>

      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
          zIndex: 10,
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 2rem",
        }}
      >
        <AnimInView variant="fadeIn">
          <div
            className="env-divider"
            style={{
              width: "72px",
              marginBottom: "1.8rem",
              "--env-gold": gold,
            } as React.CSSProperties}
          />
        </AnimInView>

        <AnimInView variant="fadeUp" delay={0.1}>
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.62rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: heroUrl ? "rgba(255,255,255,0.72)" : gold,
              marginBottom: "1rem",
            }}
          >
            {invLabel}
          </p>
        </AnimInView>

        <AnimInView variant="fadeUp" delay={0.18}>
          <h1
            style={{
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "clamp(3.4rem, 13vw, 6.5rem)",
              fontWeight: 300,
              lineHeight: 1.08,
              color: heroUrl ? "#fff" : text,
              marginBottom: "0.4rem",
              letterSpacing: "-0.01em",
            }}
          >
            {coupleLabel}
          </h1>
        </AnimInView>

        <AnimInView variant="fadeIn" delay={0.3}>
          <div
            className="env-divider"
            style={{
              width: "56px",
              margin: "1.6rem auto",
              "--env-gold": gold,
            } as React.CSSProperties}
          />
        </AnimInView>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        >
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: heroUrl ? "rgba(255,255,255,0.35)" : DEF.muted,
            }}
          >
            {t.scroll}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Couple Section ────────────────────────────────────────────────────────────

function CoupleSection({
  profile,
  gold,
  ivory,
  champagne,
  text,
  fontH,
  fontB,
  t,
}: {
  profile: NonNullable<Profile>;
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  fontB: string;
  t: Translations;
}) {
  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)`,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <SectionTitle
          eyebrow={t.eyebrow_couple}
          title={t.title_couple}
          gold={gold}
          text={text}
          fontH={fontH}
        />

        {/* Groom */}
        <AnimInView variant="fadeUp" delay={0.05}>
          <div style={{ marginBottom: "2.5rem" }}>
            {profile.showGroomPhoto && (
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  display: "inline-block",
                  marginBottom: "1.4rem",
                }}
              >
                {profile.groomPhoto ? (
                  <div
                    style={{
                      width: 154,
                      height: 154,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `3px solid ${gold}55`,
                      boxShadow: `0 0 0 7px ${champagne}, 0 8px 36px ${gold}30`,
                      margin: "0 auto",
                    }}
                  >
                    <img
                      src={profile.groomPhoto}
                      alt={profile.groomName}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 154,
                      height: 154,
                      borderRadius: "50%",
                      background: champagne,
                      border: `3px solid ${gold}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p
              style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "1.85rem",
                fontWeight: 400,
                color: text,
                marginBottom: "0.25rem",
              }}
            >
              {profile.groomName}
            </p>
            {profile.groomParents && (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: text,
                  opacity: 0.45,
                  lineHeight: 1.6,
                  fontFamily: `'${fontB}', 'Jost', sans-serif`,
                }}
              >
                {profile.groomParents}
              </p>
            )}
          </div>
        </AnimInView>

        {/* Ampersand divider */}
        <AnimInView variant="scaleIn" delay={0.1}>
          <div style={{ margin: "0.2rem 0 1.8rem" }}>
            <p
              style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "3.2rem",
                fontWeight: 300,
                lineHeight: 1,
              }}
              className="env-gold-shimmer"
            >
              &amp;
            </p>
          </div>
        </AnimInView>

        {/* Bride */}
        <AnimInView variant="fadeUp" delay={0.15}>
          <div style={{ marginBottom: "2.5rem" }}>
            {profile.showBridePhoto && (
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  display: "inline-block",
                  marginBottom: "1.4rem",
                }}
              >
                {profile.bridePhoto ? (
                  <div
                    style={{
                      width: 154,
                      height: 154,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `3px solid ${gold}55`,
                      boxShadow: `0 0 0 7px ${champagne}, 0 8px 36px ${gold}30`,
                      margin: "0 auto",
                    }}
                  >
                    <img
                      src={profile.bridePhoto}
                      alt={profile.brideName}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 154,
                      height: 154,
                      borderRadius: "50%",
                      background: champagne,
                      border: `3px solid ${gold}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p
              style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "1.85rem",
                fontWeight: 400,
                color: text,
                marginBottom: "0.25rem",
              }}
            >
              {profile.brideName}
            </p>
            {profile.brideParents && (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: text,
                  opacity: 0.45,
                  lineHeight: 1.6,
                  fontFamily: `'${fontB}', 'Jost', sans-serif`,
                }}
              >
                {profile.brideParents}
              </p>
            )}
          </div>
        </AnimInView>

        {/* Opening quote */}
        {profile.openingQuote && (
          <AnimInView variant="fadeUp" delay={0.2}>
            <div
              style={{
                borderTop: `1px solid ${gold}28`,
                paddingTop: "2.5rem",
                marginTop: "0.5rem",
              }}
            >
              <p
                style={{
                  fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                  fontSize: "1.15rem",
                  fontStyle: "italic",
                  fontWeight: 300,
                  lineHeight: 1.75,
                  color: text,
                  opacity: 0.68,
                }}
              >
                &ldquo;{profile.openingQuote}&rdquo;
              </p>
              {profile.openingQuoteBy && (
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: gold,
                    marginTop: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  — {profile.openingQuoteBy}
                </p>
              )}
            </div>
          </AnimInView>
        )}

        {/* Story */}
        {profile.story && (
          <AnimInView variant="fadeUp" delay={0.25}>
            <div
              style={{
                borderTop: `1px solid ${gold}22`,
                paddingTop: "2.5rem",
                marginTop: "2rem",
              }}
            >
              {profile.showStoryTitle && (
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: gold,
                    marginBottom: "1.2rem",
                  }}
                >
                  {profile.storyTitle?.trim() || t.ourStory}
                </p>
              )}
              <div
                className="story-html"
                style={{ fontSize: "0.9rem", lineHeight: 1.9, color: text, opacity: 0.6, fontFamily: `'${fontB}', 'Jost', sans-serif`, textAlign: "left" }}
                dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
              />
            </div>
          </AnimInView>
        )}
      </div>
    </section>
  );
}

// ─── Events Section ────────────────────────────────────────────────────────────

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

function EventsSection({
  events,
  gold,
  ivory,
  champagne,
  text,
  fontH,
  fontB,
  t,
  showMap,
}: {
  events: Props["client"]["events"];
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  fontB: string;
  t: Translations;
  showMap: boolean;
}) {
  if (!events.length) return null;

  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${champagne} 0%, ${ivory} 100%)`,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle
          eyebrow={t.eyebrow_event}
          title={t.title_event}
          gold={gold}
          text={text}
          fontH={fontH}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {events.map((ev, i) => (
            <AnimInView key={ev.id} variant="fadeUp" delay={i * 0.08}>
              <motion.div
                whileHover={{
                  y: -4,
                  boxShadow: `0 18px 48px ${gold}18`,
                  transition: { duration: 0.3 },
                }}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "1.8rem",
                  border: `1px solid ${gold}22`,
                  boxShadow: `0 4px 24px rgba(51,40,32,0.07)`,
                }}
              >
                {/* Event header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.9rem",
                    marginBottom: "1.4rem",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "30px",
                      borderRadius: "99px",
                      background: `linear-gradient(to bottom, ${gold}, ${gold}44)`,
                      flexShrink: 0,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                      fontSize: "1.45rem",
                      fontWeight: 400,
                      color: text,
                      lineHeight: 1.2,
                    }}
                  >
                    {ev.label || EVENT_LABEL[ev.type] || ev.type}
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                  }}
                >
                  {ev.date && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <Calendar size={13} color={gold} style={{ flexShrink: 0 }} />
                      <p
                        style={{
                          fontSize: "0.84rem",
                          color: text,
                          opacity: 0.68,
                          fontFamily: `'${fontB}', 'Jost', sans-serif`,
                        }}
                      >
                        {formatDate(ev.date)}
                      </p>
                    </div>
                  )}

                  {(ev.timeStart || ev.timeEnd) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <Clock size={13} color={gold} style={{ flexShrink: 0 }} />
                      <p
                        style={{
                          fontSize: "0.84rem",
                          color: text,
                          opacity: 0.68,
                          fontFamily: `'${fontB}', 'Jost', sans-serif`,
                        }}
                      >
                        {ev.timeStart}
                        {ev.timeEnd && ` – ${ev.timeEnd}`} WIB
                      </p>
                    </div>
                  )}

                  {ev.venueName && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                      <MapPin
                        size={13}
                        color={gold}
                        style={{ marginTop: "2px", flexShrink: 0 }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.84rem",
                            fontWeight: 500,
                            color: text,
                            opacity: 0.85,
                            fontFamily: `'${fontB}', 'Jost', sans-serif`,
                          }}
                        >
                          {ev.venueName}
                        </p>
                        {ev.venueAddress && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: text,
                              opacity: 0.42,
                              marginTop: "0.2rem",
                              lineHeight: 1.55,
                              fontFamily: `'${fontB}', 'Jost', sans-serif`,
                            }}
                          >
                            {ev.venueAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {showMap && ev.mapsUrl && ev.venueName && (
                  <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                    <iframe
                      src={getMapEmbedUrl(ev.mapsUrl, ev.venueName, ev.venueAddress)}
                      width="100%" height="200"
                      style={{ display: "block", border: "none" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={ev.venueName}
                    />
                  </div>
                )}
                {ev.mapsUrl && (
                  <a
                    href={ev.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      marginTop: "1.4rem",
                      padding: "0.65rem",
                      border: `1px solid ${gold}55`,
                      borderRadius: "9999px",
                      fontSize: "0.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: gold,
                      textDecoration: "none",
                      fontFamily: "'Cinzel', serif",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.background = gold;
                      el.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "transparent";
                      el.style.color = gold;
                    }}
                  >
                    <MapPin size={11} />
                    {t.viewLocation}
                  </a>
                )}
              </motion.div>
            </AnimInView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Polaroid Gallery ──────────────────────────────────────────────────────────

const POLAROID_ROTATIONS = [-3.5, 2.2, -5, 1.8, -2.3, 4.1, -1.5, 3.3, -4.2, 2.0, -0.8, 3.8];

function GallerySection({
  galleries,
  gold,
  champagne,
  text,
  fontH,
  t,
}: {
  galleries: Props["client"]["galleries"];
  gold: string;
  ivory?: string;
  champagne: string;
  text: string;
  fontH: string;
  t: Translations;
}) {
  const photos = galleries.filter(
    (g) => g.type === "GALLERY" || g.type === "PREWEDDING"
  );

  // All hooks must be called before any early returns
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const rotations = useMemo(
    () => photos.map((_, i) => POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]),
    [photos]
  );

  const prev = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? Math.max(0, i - 1) : null));
  }, []);

  const next = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? Math.min(photos.length - 1, i + 1) : null));
  }, [photos.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxIdx(null);
    },
    [prev, next]
  );

  if (!photos.length) return null;

  return (
    <section
      style={{
        padding: "6rem 0",
        background: `linear-gradient(160deg, #f9f4ed 0%, ${champagne} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{ padding: "0 1.5rem", maxWidth: "480px", margin: "0 auto" }}
      >
        <SectionTitle
          eyebrow={t.eyebrow_gallery}
          title={t.title_gallery}
          gold={gold}
          text={text}
          fontH={fontH}
        />
      </div>

      {/* Scrapbook grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "clamp(1.2rem, 4vw, 2.2rem)",
          maxWidth: "500px",
          margin: "0 auto",
          padding: "1rem clamp(1rem, 5vw, 2.5rem) 2rem",
        }}
      >
        {photos.map((photo, i) => (
          <AnimInView
            key={photo.id}
            variant="scaleIn"
            delay={i * 0.06}
            amount={0.08}
          >
            <motion.div
              whileHover={{
                scale: 1.04,
                rotate: 0,
                zIndex: 20,
                boxShadow: "0 16px 52px rgba(51,40,32,0.22), 0 4px 16px rgba(51,40,32,0.1)",
                transition: { duration: 0.35, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "#fff",
                padding: "clamp(7px, 2vw, 10px) clamp(7px, 2vw, 10px) clamp(28px, 7vw, 38px)",
                boxShadow:
                  "0 4px 20px rgba(51,40,32,0.14), 0 1px 5px rgba(51,40,32,0.08)",
                rotate: `${rotations[i]}deg`,
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                zIndex: 1,
              }}
              onClick={() => setLightboxIdx(i)}
            >
              <div style={{ overflow: "hidden" }}>
                <img
                  src={photo.url}
                  alt={`Memory ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{
                    display: "block",
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                  }}
                />
              </div>
              {/* Subtle caption line on polaroid bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "28px",
                  height: "1px",
                  background: `${gold}66`,
                }}
              />
            </motion.div>
          </AnimInView>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxIdx(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 300,
              background: "rgba(26,18,14,0.94)",
              backdropFilter: "blur(16px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              outline: "none",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxIdx(null)}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(255,255,255,0.85)",
                zIndex: 10,
              }}
            >
              <X size={16} />
            </button>

            {/* Prev */}
            {lightboxIdx > 0 && (
              <button
                onClick={prev}
                style={{
                  position: "absolute",
                  left: "0.8rem",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  zIndex: 10,
                }}
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* Next */}
            {lightboxIdx < photos.length - 1 && (
              <button
                onClick={next}
                style={{
                  position: "absolute",
                  right: "0.8rem",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  zIndex: 10,
                }}
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Photo — swipe support */}
            <motion.div
              key={lightboxIdx}
              initial={{ scale: 0.86, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onPointerDown={(e) => {
                dragStartX.current = e.clientX;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                if (dragStartX.current === null) return;
                const dx = e.clientX - dragStartX.current;
                dragStartX.current = null;
                if (Math.abs(dx) < 40) return;
                if (dx < 0) next();
                else prev();
              }}
              style={{ cursor: "grab", touchAction: "none" }}
            >
              {/* Polaroid frame in lightbox */}
              <div
                style={{
                  background: "#fff",
                  padding: "clamp(8px, 2.5vw, 14px) clamp(8px, 2.5vw, 14px) clamp(36px, 10vw, 56px)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                  maxWidth: "min(380px, 90vw)",
                }}
              >
                <img
                  src={photos[lightboxIdx].url}
                  alt=""
                  loading="eager"
                  decoding="async"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: "60dvh",
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </motion.div>

            {/* Counter */}
            <div
              style={{
                position: "absolute",
                bottom: "1.5rem",
                left: 0,
                right: 0,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {lightboxIdx + 1} / {photos.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── RSVP Section ──────────────────────────────────────────────────────────────

function RSVPSection({
  clientId,
  guest,
  token,
  gold,
  ivory,
  champagne,
  text,
  fontH,
  fontB,
  t,
  onConfirmed,
}: {
  clientId: string;
  guest: Guest;
  token: string;
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  fontB: string;
  t: Translations;
  onConfirmed?: (status: "HADIR" | "TIDAK_HADIR") => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">(
    (guest.rsvp?.status as "HADIR" | "TIDAK_HADIR") || "HADIR"
  );
  const [pax, setPax] = useState(guest.rsvp?.paxCount || 1);
  const [msg, setMsg] = useState(guest.rsvp?.message || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        guestId: guest.id,
        token,
        name: guest.name,
        paxCount: pax,
        status,
        message: msg,
      }),
    });
    if (res.ok) { setDone(true); onConfirmed?.(status); }
    setSaving(false);
  }

  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)`,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle
          eyebrow={t.eyebrow_rsvp}
          title={t.title_rsvp}
          gold={gold}
          text={text}
          fontH={fontH}
        />

        <AnimInView variant="fadeUp" delay={0.1}>
          {done ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 1.5rem",
                background: "#fff",
                borderRadius: "24px",
                border: `1px solid ${gold}22`,
                boxShadow: `0 8px 40px ${gold}0f`,
              }}
            >
              <motion.div
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `${gold}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.2rem",
                }}
              >
                <Heart size={24} color={gold} />
              </motion.div>
              <p
                style={{
                  fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                  fontSize: "1.4rem",
                  fontWeight: 400,
                  color: text,
                  marginBottom: "0.4rem",
                }}
              >
                {t.thankYou}
              </p>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: text,
                  opacity: 0.45,
                  fontFamily: `'${fontB}', 'Jost', sans-serif`,
                }}
              >
                {t.confirmed}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "1.85rem",
                border: `1px solid ${gold}22`,
                boxShadow: `0 6px 32px ${gold}0c`,
              }}
            >
              {/* Status toggle */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.4rem" }}>
                {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => setStatus(s)}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "9999px",
                      border: `1px solid ${status === s ? gold : gold + "28"}`,
                      background:
                        status === s
                          ? `linear-gradient(135deg, ${gold}24, ${gold}0f)`
                          : "transparent",
                      color: status === s ? gold : `${text}55`,
                      fontSize: "0.65rem",
                      fontWeight: 500,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "'Cinzel', serif",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {s === "HADIR" ? t.attending : t.notAttending}
                  </motion.button>
                ))}
              </div>

              {/* Pax count */}
              <AnimatePresence>
                {status === "HADIR" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden", marginBottom: "1.2rem" }}
                  >
                    <p
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.6rem",
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        color: gold,
                        marginBottom: "0.75rem",
                      }}
                    >
                      {t.guestCount}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.1rem",
                      }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setPax((p) => Math.max(1, p - 1))}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: `1px solid ${gold}44`,
                          background: "transparent",
                          color: text,
                          fontSize: "1.2rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        −
                      </motion.button>
                      <span
                        style={{
                          fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                          fontSize: "1.6rem",
                          fontWeight: 300,
                          color: text,
                          minWidth: "1.8rem",
                          textAlign: "center",
                        }}
                      >
                        {pax}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setPax((p) => Math.min(guest.maxPax, p + 1))}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: `1px solid ${gold}44`,
                          background: "transparent",
                          color: text,
                          fontSize: "1.2rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </motion.button>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: text,
                          opacity: 0.38,
                          fontFamily: `'${fontB}', 'Jost', sans-serif`,
                        }}
                      >
                        {t.max} {guest.maxPax}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message */}
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={3}
                placeholder={t.messagePlaceholder}
                style={{
                  width: "100%",
                  background: champagne,
                  border: `1px solid ${gold}22`,
                  borderRadius: "14px",
                  padding: "0.8rem 1rem",
                  fontSize: "0.84rem",
                  color: text,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: `'${fontB}', 'Jost', sans-serif`,
                  lineHeight: 1.65,
                }}
              />

              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 10px 28px ${gold}50`,
                  transition: { duration: 0.25 },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={submit}
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  padding: "0.95rem",
                  background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`,
                  backgroundSize: "200% 100%",
                  color: "#2a1c14",
                  border: "none",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Cinzel', serif",
                  opacity: saving ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {saving ? t.sending : t.confirmBtn}
              </motion.button>
            </div>
          )}
        </AnimInView>
      </div>
    </section>
  );
}

function RSVPPlaceholder({
  gold,
  ivory,
  champagne,
  text,
  fontH,
  t,
}: {
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  t: Translations;
}) {
  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)`,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle
          eyebrow={t.eyebrow_rsvp}
          title={t.title_rsvp}
          gold={gold}
          text={text}
          fontH={fontH}
        />
        <AnimInView variant="scaleIn" delay={0.1}>
          <div
            style={{
              textAlign: "center",
              padding: "3.5rem 1.5rem",
              background: "#fff",
              borderRadius: "24px",
              border: `1px solid ${gold}22`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: `${gold}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.2rem",
              }}
            >
              <LockKeyhole size={20} color={gold} />
            </div>
            <p
              style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "1.2rem",
                color: text,
                marginBottom: "0.4rem",
              }}
            >
              {t.confirmBtn}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: text,
                opacity: 0.42,
                lineHeight: 1.65,
              }}
            >
              {t.rsvpLocked}
            </p>
            {/* Visual preview of hadir/tidak hadir options */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", pointerEvents: "none" }}>
              {[t.attending, t.notAttending].map((s) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "9999px",
                    border: `1px solid ${gold}28`,
                    fontSize: "0.6rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: `${gold}50`,
                    textAlign: "center",
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Wishes Section ────────────────────────────────────────────────────────────

function WishesSection({
  clientId,
  initialWishes,
  guestName,
  guestId,
  gold,
  ivory,
  champagne,
  text,
  fontH,
  fontB,
  t,
}: {
  clientId: string;
  initialWishes: Props["client"]["wishes"];
  guestName?: string;
  guestId?: string;
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  fontB: string;
  t: Translations;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName || "");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name: name || "Tamu", message: msg, guestId }),
    });
    if (res.ok) {
      const data = await res.json();
      setWishes((p) => [data, ...p]);
      setMsg("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: `1px solid ${gold}22`,
    borderRadius: "14px",
    padding: "0.8rem 1rem",
    fontSize: "0.84rem",
    color: text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: `'${fontB}', 'Jost', sans-serif`,
  };

  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${champagne} 0%, ${ivory} 100%)`,
      }}
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <SectionTitle
          eyebrow={t.eyebrow_wishes}
          title={t.title_wishes}
          gold={gold}
          text={text}
          fontH={fontH}
        />

        {/* Input form */}
        <AnimInView variant="fadeUp" delay={0.1}>
          <div
            style={{
              background: champagne,
              borderRadius: "22px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: `1px solid ${gold}1a`,
              boxShadow: `0 4px 20px rgba(51,40,32,0.05)`,
            }}
          >
            {!guestName && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.yourName}
                style={{ ...inputBase, marginBottom: "0.75rem" }}
              />
            )}
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              placeholder={t.wishPlaceholder}
              style={{ ...inputBase, resize: "none", marginBottom: "0.75rem", lineHeight: 1.65 }}
            />
            <motion.button
              whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={sending || !msg.trim()}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`,
                color: "#2a1c14",
                border: "none",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                opacity: sending || !msg.trim() ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <Send size={13} />
              {sent ? t.sent : sending ? t.sending : t.sendWish}
            </motion.button>
          </div>
        </AnimInView>

        {/* Wishes list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            maxHeight: "400px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {wishes.length === 0 && (
            <p
              style={{
                textAlign: "center",
                padding: "2.5rem 0",
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "1rem",
                fontStyle: "italic",
                color: text,
                opacity: 0.35,
              }}
            >
              {t.beFirst}
            </p>
          )}
          {wishes.map((w, i) => (
            <AnimInView key={w.id} variant="fadeUp" delay={Math.min(i * 0.04, 0.2)}>
              <motion.div
                whileHover={{ y: -2, transition: { duration: 0.22 } }}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "1.1rem 1.3rem",
                  border: `1px solid ${gold}18`,
                  boxShadow: `0 2px 12px rgba(51,40,32,0.05)`,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    color: gold,
                    marginBottom: "0.35rem",
                    textTransform: "uppercase",
                  }}
                >
                  {w.name}
                </p>
                <p
                  style={{
                    fontSize: "0.86rem",
                    lineHeight: 1.7,
                    color: text,
                    opacity: 0.68,
                    fontFamily: `'${fontB}', 'Jost', sans-serif`,
                  }}
                >
                  {w.message}
                </p>
                {w.reply && (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      paddingTop: "0.85rem",
                      borderTop: `1px solid ${gold}1a`,
                      paddingLeft: "0.85rem",
                      borderLeft: `2px solid ${gold}66`,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.55rem",
                        letterSpacing: "0.16em",
                        color: gold,
                        marginBottom: "0.25rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.reply}
                    </p>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: 1.65,
                        color: text,
                        opacity: 0.55,
                        fontStyle: "italic",
                        fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                      }}
                    >
                      {w.reply}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimInView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gift Section ──────────────────────────────────────────────────────────────

function getBankGradient(name: string): [string, string] {
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(BANK_GRADIENTS)) {
    if (u.includes(k)) return v;
  }
  return ["#3d2e28", "#6b5248"];
}

function GiftSection({
  gifts,
  gold,
  ivory,
  champagne,
  text,
  fontH,
  fontB,
  t,
}: {
  gifts: Props["client"]["gifts"];
  gold: string;
  ivory: string;
  champagne: string;
  text: string;
  fontH: string;
  fontB: string;
  t: Translations;
}) {
  const active = gifts.filter((g) => g.isActive);

  // Hooks must come before early returns
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  if (!active.length) return null;

  const banks = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, val: string) {
    await navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  }

  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)`,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle
          eyebrow={t.eyebrow_gift}
          title={t.title_gift}
          gold={gold}
          text={text}
          fontH={fontH}
        />

        <AnimInView variant="fadeIn" delay={0.05}>
          <p
            style={{
              textAlign: "center",
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "1rem",
              fontStyle: "italic",
              fontWeight: 300,
              color: text,
              opacity: 0.5,
              marginBottom: "2rem",
              lineHeight: 1.7,
            }}
          >
            {t.giftNote}
          </p>
        </AnimInView>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {banks.map((gift, i) => {
            const [from, to] = getBankGradient(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <AnimInView key={gift.id} variant="scaleIn" delay={i * 0.06}>
                <motion.div
                  whileHover={{
                    y: -5,
                    boxShadow: "0 24px 56px rgba(51,40,32,0.22)",
                    transition: { duration: 0.3 },
                  }}
                  style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                    aspectRatio: "1.586/1",
                    minHeight: "185px",
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "1.3rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#fff",
                          fontSize: "1.05rem",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {gift.bankName}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.38)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          fontFamily: "'Cinzel', serif",
                        }}
                      >
                        {t.transferLabel}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "monospace",
                        color: "#fff",
                        fontSize: "1.05rem",
                        letterSpacing: "0.22em",
                      }}
                    >
                      {(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.38)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            marginBottom: "2px",
                          }}
                        >
                          {t.accountName}
                        </p>
                        <p
                          style={{
                            color: "#fff",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            textTransform: "uppercase",
                          }}
                        >
                          {gift.accountName}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(key, gift.accountNumber || "")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.38rem 0.75rem",
                          border: "1px solid rgba(255,255,255,0.28)",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                        }}
                      >
                        {copiedId === key ? (
                          <>
                            <Check size={11} /> {t.copied}
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> {t.copy}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimInView>
            );
          })}

          {ewallets.map((gift, i) => {
            const key = `ew-${gift.id}`;
            return (
              <AnimInView key={gift.id} variant="fadeUp" delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.25 } }}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    border: `1px solid ${gold}22`,
                    boxShadow: `0 3px 16px rgba(51,40,32,0.06)`,
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem",
                      borderRadius: "12px",
                      background: `${gold}16`,
                      flexShrink: 0,
                    }}
                  >
                    <Wallet size={18} color={gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.56rem",
                        color: text,
                        opacity: 0.38,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      {t.eWallet}
                    </p>
                    <p
                      style={{
                        fontWeight: 600,
                        color: text,
                        fontSize: "0.92rem",
                        fontFamily: `'${fontB}', 'Jost', sans-serif`,
                      }}
                    >
                      {gift.ewalletType}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.82rem",
                        color: text,
                        opacity: 0.55,
                        marginTop: "1px",
                      }}
                    >
                      {gift.ewalletNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(key, gift.ewalletNumber || "")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: text,
                      opacity: 0.4,
                      padding: "4px",
                    }}
                  >
                    {copiedId === key ? (
                      <Check size={15} color={gold} />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </motion.div>
              </AnimInView>
            );
          })}

          {qrisList.map((gift, i) => (
            <AnimInView key={gift.id} variant="fadeUp" delay={i * 0.06}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${gold}22`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.2rem",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}
                  >
                    <div
                      style={{
                        padding: "0.75rem",
                        borderRadius: "12px",
                        background: `${gold}16`,
                      }}
                    >
                      <QrCode size={18} color={gold} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: "0.56rem",
                          color: text,
                          opacity: 0.38,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}
                      >
                        {t.qris}
                      </p>
                      <p
                        style={{
                          fontWeight: 600,
                          color: text,
                          fontSize: "0.9rem",
                          fontFamily: `'${fontB}', 'Jost', sans-serif`,
                        }}
                      >
                        {gift.ewalletType || gift.bankName || "Scan QR"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)}
                    style={{
                      padding: "0.5rem 1.1rem",
                      border: `1px solid ${gold}55`,
                      borderRadius: "9999px",
                      background: "transparent",
                      color: gold,
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.6rem",
                      letterSpacing: "0.12em",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {qrisOpen === gift.id ? t.closeQr : t.viewQr}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {qrisOpen === gift.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        overflow: "hidden",
                        borderTop: `1px solid ${gold}18`,
                        padding: "1.3rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={gift.qrisImage!}
                        alt="QRIS"
                        loading="lazy"
                        decoding="async"
                        style={{
                          maxWidth: "175px",
                          width: "100%",
                          borderRadius: "12px",
                        }}
                      />
                      <p
                        style={{
                          marginTop: "0.6rem",
                          fontFamily: "'Jost', sans-serif",
                          fontSize: "0.7rem",
                          color: text,
                          opacity: 0.38,
                        }}
                      >
                        {t.scanToTransfer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimInView>
          ))}
        </div>

        <AnimInView variant="fadeIn" delay={0.15}>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Gift
              size={18}
              color={gold}
              style={{ opacity: 0.35, margin: "0 auto 0.6rem", display: "block" }}
            />
            <p
              style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "0.88rem",
                fontStyle: "italic",
                color: text,
                opacity: 0.32,
              }}
            >
              {t.giftThanks}
            </p>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Closing Section ───────────────────────────────────────────────────────────

function ClosingSection({
  coupleLabel,
  gold,
  fontH,
  t,
}: {
  coupleLabel: string;
  gold: string;
  text?: string;
  fontH: string;
  t: Translations;
}) {
  return (
    <footer
      style={{
        padding: "5rem 1.5rem 4rem",
        background: "#1e140f",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60%",
          height: "40%",
          background: `radial-gradient(ellipse, ${gold}18, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <AnimInView variant="fadeIn">
          <div
            className="env-divider"
            style={{
              width: "60px",
              marginBottom: "2rem",
              "--env-gold": gold,
            } as React.CSSProperties}
          />
        </AnimInView>

        <AnimInView variant="fadeUp" delay={0.1}>
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.58rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: `${gold}88`,
              marginBottom: "0.8rem",
            }}
          >
            {t.withLove}
          </p>
        </AnimInView>

        <AnimInView variant="fadeUp" delay={0.16}>
          <p
            style={{
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "clamp(1.8rem, 6vw, 2.6rem)",
              fontWeight: 300,
              color: gold,
              lineHeight: 1.15,
              marginBottom: "0.5rem",
            }}
          >
            {coupleLabel}
          </p>
        </AnimInView>

        <AnimInView variant="fadeIn" delay={0.24}>
          <div
            className="env-divider"
            style={{
              width: "44px",
              margin: "1.8rem auto",
              "--env-gold": gold,
            } as React.CSSProperties}
          />
        </AnimInView>

        <AnimInView variant="fadeIn" delay={0.3}>
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.15)",
            }}
          >
            {t.forever}
          </p>
        </AnimInView>

        <AnimInView variant="fadeIn" delay={0.38}>
          <p
            style={{
              marginTop: "2.5rem",
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.1)",
              fontFamily: "'Jost', sans-serif",
            }}
          >
            {t.madeWith}
          </p>
        </AnimInView>
      </div>
    </footer>
  );
}

// ─── Main Template ─────────────────────────────────────────────────────────────

export function EnvelopeTemplate({ guest, client, token }: Props) {
  const [coverGone, setCoverGone] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const t: Translations = TR[lang];
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );

  const profile = client.weddingProfile;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const showCountdown = !!client.theme?.showCountdown;
  const showMap = client.theme?.showMap !== false;
  const barcodeVisibility = client.theme?.barcodeVisibility ?? "AFTER_RSVP";
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const heroGallery = client.galleries.find((g) => g.type === "HERO");
  const coverGallery = client.galleries.find((g) => g.type === "COVER");
  const bgGallery = client.galleries.find((g) => g.type === "BACKGROUND");
  const heroUrl = heroGallery?.url || coverGallery?.url;

  const th = client.theme;
  const gold = th?.primaryColor || DEF.gold;
  const ivory = th?.bgColor || DEF.ivory;
  const champagne = th?.secondaryColor || DEF.champagne;
  const text = th?.textColor || DEF.text;
  const fontH = th?.fontHeading || "Cormorant Garamond";
  const fontB = th?.fontBody || "Jost";

  const invLabel = INVITATION_LABEL[client.clientType] || "The Wedding Of";
  const groomNick = profile?.groomNickname || profile?.groomName || "Groom";
  const brideNick = profile?.brideNickname || profile?.brideName || "Bride";
  const coupleLabel = `${groomNick} & ${brideNick}`;

  const playMusicRef = useRef<(() => void) | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [heroPassed, setHeroPassed] = useState(false);

  function handleEnvelopeComplete() {
    setCoverGone(true);
    window.scrollTo(0, 0);
    playMusicRef.current?.();
  }

  // First scroll after opening → auto-scroll to section after hero
  useEffect(() => {
    if (!coverGone || heroPassed) return;

    function onFirstScroll() {
      if (window.scrollY < 10) return;
      const targetY = anchorRef.current?.offsetTop ?? 0;
      if (!targetY) return;

      setHeroPassed(true);

      // Custom smooth scroll — ease-out-quart feels premium and stops cleanly
      const startY = window.scrollY;
      const distance = targetY - startY;
      const duration = 900;
      const startTime = performance.now();

      function easeOutQuart(t: number) {
        return 1 - Math.pow(1 - t, 4);
      }

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeOutQuart(progress));
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    window.addEventListener("scroll", onFirstScroll, { passive: true });
    return () => window.removeEventListener("scroll", onFirstScroll);
  }, [coverGone, heroPassed]);

  // After passing hero → block scrolling back up
  useEffect(() => {
    if (!heroPassed) return;

    function lockUpScroll() {
      const minY = anchorRef.current?.offsetTop ?? 0;
      if (window.scrollY < minY) {
        window.scrollTo({ top: minY, behavior: "instant" as ScrollBehavior });
      }
    }

    let touchStartY = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(e: TouchEvent) {
      const minY = anchorRef.current?.offsetTop ?? 0;
      const movingUp = (e.touches[0]?.clientY ?? 0) > touchStartY;
      if (window.scrollY <= minY && movingUp) {
        e.preventDefault();
      }
    }
    function onWheel(e: WheelEvent) {
      const minY = anchorRef.current?.offsetTop ?? 0;
      if (window.scrollY <= minY && e.deltaY < 0) {
        e.preventDefault();
      }
    }

    window.addEventListener("scroll", lockUpScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("scroll", lockUpScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [heroPassed]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap');
        body {
          background-color: ${ivory};
          color: ${text};
          margin: 0;
          -webkit-font-smoothing: antialiased;
          font-family: '${fontB}', 'Jost', sans-serif;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${gold}44; border-radius: 9999px; }
      `}</style>

      {music && (
        <MusicPlayer
          url={music.url}
          title={music.title}
          registerPlay={(fn) => {
            playMusicRef.current = fn;
          }}
        />
      )}

      {/* Language toggle — always visible */}
      <div
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "1rem",
          zIndex: 10000,
          display: "flex",
          borderRadius: "9999px",
          overflow: "hidden",
          border: `1px solid ${gold}44`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.1)`,
        }}
      >
        {(["id", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.65rem",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              background: lang === l ? gold : ivory,
              color: lang === l ? "#fff" : gold,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Envelope Opening Screen */}
      <AnimatePresence>
        {!coverGone && (
          <EnvelopeOpening
            onComplete={handleEnvelopeComplete}
            guestName={guest?.name || null}
            groomNick={groomNick}
            brideNick={brideNick}
            heroImage={heroUrl || null}
            gold={gold}
            fontH={fontH}
            invLabel={invLabel}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Main Invitation Content */}
      <motion.div
        className="env-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: coverGone ? 1 : 0 }}
        transition={{ duration: 0.7 }}
        style={{
          minHeight: "100dvh",
          position: "relative",
          background: bgGallery ? undefined : ivory,
          backgroundImage: bgGallery ? `url('${bgGallery.url}')` : undefined,
          backgroundAttachment: bgGallery ? "fixed" : undefined,
          backgroundSize: bgGallery ? "cover" : undefined,
          backgroundPosition: bgGallery ? "center" : undefined,
        }}
      >
        {bgGallery && (
          <div
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              background: `${ivory}d0`,
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ position: "relative", zIndex: 1 }}>
          {coverGone && (
            <>
              {/* Hero */}
              <HeroSection
                heroUrl={heroUrl}
                gold={gold}
                ivory={ivory}
                text={text}
                fontH={fontH}
                coupleLabel={coupleLabel}
                invLabel={invLabel}
                t={t}
              />

              {/* Scroll anchor — first scroll snaps here, can't go above */}
              <div ref={anchorRef} aria-hidden style={{ height: 0 }} />

              {/* Countdown */}
              {showCountdown && countdownTimeLeft && (
                <section style={{ padding: "3.5rem 1.5rem", background: champagne, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "1.6rem" }}>
                    {t.countdownLabel}
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                    {[{ v: countdownTimeLeft.days, l: t.days }, { v: countdownTimeLeft.hours, l: t.hours }, { v: countdownTimeLeft.minutes, l: t.minutes }, { v: countdownTimeLeft.seconds, l: t.seconds }].map(({ v, l }) => (
                      <div key={l} style={{ textAlign: "center", minWidth: "3rem" }}>
                        <div style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "2.6rem", fontWeight: 300, color: gold, lineHeight: 1 }}>
                          {String(v).padStart(2, "0")}
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: DEF.muted, marginTop: "0.35rem" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Couple */}
              {sectionKeys.includes("COUPLE") && profile && (
                <CoupleSection
                  profile={profile}
                  gold={gold}
                  ivory={ivory}
                  champagne={champagne}
                  text={text}
                  fontH={fontH}
                  fontB={fontB}
                  t={t}
                />
              )}

              {profile?.attentionContent && (
                <AttentionSection
                  title={profile.attentionTitle}
                  content={profile.attentionContent}
                  primaryColor={gold}
                  bgColor={ivory}
                  textColor={text}
                  fontBody={fontB}
                />
              )}

              {/* Events */}
              {sectionKeys.includes("EVENT") && (
                <EventsSection
                  events={client.events}
                  gold={gold}
                  ivory={ivory}
                  champagne={champagne}
                  text={text}
                  fontH={fontH}
                  fontB={fontB}
                  t={t}
                  showMap={showMap}
                />
              )}

              {/* Gallery */}
              {sectionKeys.includes("GALLERY") && (
                <GallerySection
                  galleries={client.galleries}
                  gold={gold}
                  ivory={ivory}
                  champagne={champagne}
                  text={text}
                  fontH={fontH}
                  t={t}
                />
              )}

              {/* RSVP */}
              {sectionKeys.includes("RSVP") &&
                (token && guest ? (
                  <RSVPSection
                    clientId={client.id}
                    guest={guest}
                    token={token}
                    gold={gold}
                    ivory={ivory}
                    champagne={champagne}
                    text={text}
                    fontH={fontH}
                    fontB={fontB}
                    t={t}
                    onConfirmed={(s) => setConfirmedRsvpStatus(s)}
                  />
                ) : (
                  <RSVPPlaceholder
                    gold={gold}
                    ivory={ivory}
                    champagne={champagne}
                    text={text}
                    fontH={fontH}
                    t={t}
                  />
                ))}

              {guest?.barcodeChurch && (barcodeVisibility === "ALWAYS" || (barcodeVisibility === "AFTER_RSVP" && confirmedRsvpStatus === "HADIR")) && (
                <BarcodeSection
                  barcodeChurch={guest.barcodeChurch}
                  barcodeReception={guest.barcodeReception ?? null}
                  invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
                  churchLabel={getEventLabel(client.events.find((e: any) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.type ?? client.events[0]?.type ?? "ACARA")}
                  receptionLabel={getEventLabel(client.events.find((e: any) => e.type === "RESEPSI")?.type ?? "RESEPSI")}
                  churchVenueName={client.events.find((e: any) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.venueName || client.events[0]?.venueName || "Venue"}
                  receptionVenueName={client.events.find((e: any) => e.type === "RESEPSI")?.venueName || "Resepsi"}
                  primaryColor={gold}
                  bgColor={ivory}
                  fontHeading={fontH}
                  lang={lang}
                />
              )}

              {/* Wishes */}
              {sectionKeys.includes("WISHES") && (
                <WishesSection
                  clientId={client.id}
                  initialWishes={client.wishes}
                  guestName={guest?.name}
                  guestId={guest?.id}
                  gold={gold}
                  ivory={ivory}
                  champagne={champagne}
                  text={text}
                  fontH={fontH}
                  fontB={fontB}
                  t={t}
                />
              )}

              {/* Gift */}
              {sectionKeys.includes("GIFT") && (
                <GiftSection
                  gifts={client.gifts}
                  gold={gold}
                  ivory={ivory}
                  champagne={champagne}
                  text={text}
                  fontH={fontH}
                  fontB={fontB}
                  t={t}
                />
              )}

              {/* Closing */}
              <ClosingSection
                coupleLabel={coupleLabel}
                gold={gold}
                text={text}
                fontH={fontH}
                t={t}
              />
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
