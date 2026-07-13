"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Calendar, Copy, Check,
  Wallet, QrCode, Gift, Send, Heart, LockKeyhole,
} from "lucide-react";
import { HanoiCover } from "./HanoiCover";
import { SlideReveal } from "./JackpotAnimations";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventLabel } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import type { Rsvp } from "@/types/prisma.types";
import { useGuestLanguage } from "@/hooks/useGuestLanguage";

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

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const TR = {
  id: {
    kepada: "Kepada Yth.",
    scroll: "scroll",
    eyebrow_couple: "Mempelai", title_couple: "Dua Hati, Satu Tujuan",
    ourStory: "Kisah Kami",
    countdownLabel: "Menuju Hari Bahagia",
    days: "Hari", hours: "Jam", minutes: "Menit", seconds: "Detik",
    eyebrow_event: "Jadwal", title_event: "Rangkaian Acara",
    viewLocation: "Lihat Lokasi",
    eyebrow_gallery: "Momen", title_gallery: "Galeri Kenangan",
    eyebrow_rsvp: "Konfirmasi", title_rsvp: "RSVP",
    attending: "Hadir", notAttending: "Tidak Hadir",
    guestCount: "Jumlah Tamu", max: "maks.",
    messagePlaceholder: "Pesan atau doa (opsional)",
    confirmBtn: "Konfirmasi Kehadiran", sending: "Mengirim...",
    thankYou: "Terima kasih!", confirmed: "Konfirmasi kehadiran telah diterima",
    rsvpLocked: "RSVP tersedia melalui link undangan personal.",
    eyebrow_wishes: "Pesan", title_wishes: "Ucapan & Doa",
    yourName: "Nama Anda", wishPlaceholder: "Tulis doa dan ucapan terbaik...",
    sendWish: "Kirim Ucapan", sent: "Terkirim ✓",
    beFirst: "Jadilah yang pertama memberikan ucapan...", reply: "Balasan",
    eyebrow_gift: "Hadiah", title_gift: "Amplop Digital",
    giftNote: "Doa restu Anda adalah hadiah terbaik yang kami harapkan.",
    transferLabel: "Transfer", accountName: "Atas Nama",
    copy: "Salin", copied: "Tersalin",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "Lihat QR", closeQr: "Tutup", scanToTransfer: "Scan untuk transfer",
    giftThanks: "Terima kasih atas perhatian dan kasih sayang Anda",
    withLove: "With Love", forever: "Forever & Always",
    footerThanks: "Dibuat dengan ❤️", madeWith: "Made with love",
  },
  en: {
    kepada: "Dear",
    scroll: "scroll",
    eyebrow_couple: "The Couple", title_couple: "Two Hearts, One Journey",
    ourStory: "Our Story",
    countdownLabel: "Counting Down to Our Day",
    days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs",
    eyebrow_event: "Schedule", title_event: "Event Details",
    viewLocation: "View Location",
    eyebrow_gallery: "Moments", title_gallery: "Gallery",
    eyebrow_rsvp: "Confirmation", title_rsvp: "RSVP",
    attending: "Attending", notAttending: "Not Attending",
    guestCount: "Number of Guests", max: "max.",
    messagePlaceholder: "Message or prayer (optional)",
    confirmBtn: "Confirm Attendance", sending: "Sending...",
    thankYou: "Thank you!", confirmed: "Your attendance has been confirmed",
    rsvpLocked: "RSVP is available via your personal invitation link.",
    eyebrow_wishes: "Messages", title_wishes: "Wishes & Prayers",
    yourName: "Your Name", wishPlaceholder: "Write your wishes and prayers...",
    sendWish: "Send Wishes", sent: "Sent ✓",
    beFirst: "Be the first to leave a wish...", reply: "Reply",
    eyebrow_gift: "Gift", title_gift: "Digital Gift",
    giftNote: "Your blessings are the greatest gift we could ask for.",
    transferLabel: "Transfer", accountName: "Account Name",
    copy: "Copy", copied: "Copied",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "View QR", closeQr: "Close", scanToTransfer: "Scan to transfer",
    giftThanks: "Thank you for your love and generosity",
    withLove: "With Love", forever: "Forever & Always",
    footerThanks: "Made with ❤️", madeWith: "Made with love",
  },
} as const;

type Lang = keyof typeof TR;
type Translations = (typeof TR)[Lang];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string; name: string; maxPax: number; rsvp: Rsvp | null;
  invitationCategory?: "GEREJA_SAJA" | "GEREJA_RESEPSI";
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

type Profile = {
  groomName: string; brideName: string;
  groomNickname: string; brideNickname: string;
  groomParents: string; brideParents: string;
  openingQuote: string | null; openingQuoteBy: string | null;
  story: string | null; storyTitle: string | null; showStoryTitle: boolean;
  heroImage: string | null;
  groomPhoto: string | null; bridePhoto: string | null;
  showGroomPhoto: boolean; showBridePhoto: boolean;
  attentionTitle: string | null; attentionContent: string | null;
  attentionTitleEn: string | null; attentionContentEn: string | null;
} | null;

interface Props {
  guest: Guest | null;
  client: {
    id: string; name: string; slug: string; clientType: string;
    weddingProfile: Profile;
    events: { id: string; type: string; label: string; date: Date | null; timeStart: string; timeEnd: string; venueName: string; venueAddress: string; mapsUrl: string }[];
    musics: { url: string; title: string }[];
    sections: { sectionKey: string; sortOrder: number }[];
    galleries: { id: string; url: string; type: string; sortOrder: number }[];
    gifts: { id: string; bankName: string | null; accountNumber: string | null; accountName: string | null; ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean }[];
    wishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
    theme: { templateSlug?: string | null; primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null; showMap?: boolean | null; barcodeVisibility?: string | null } | null;
  };
  token: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  AKAD: "Akad", PEMBERKATAN: "Church Ceremony",
  RESEPSI: "Reception", AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit", LAMARAN: "Engagement Ceremony",
};

const INVITATION_LABEL: Record<string, string> = {
  WEDDING: "The Wedding Of",
  SANGJIT: "Sangjit Ceremony Of",
  LAMARAN: "Lamaran",
};

const BANK_GRADIENTS: Record<string, [string, string]> = {
  BCA: ["#005bac", "#1a8fe0"], BNI: ["#e65c00", "#f9a825"],
  MANDIRI: ["#003087", "#0057e0"], BRI: ["#003087", "#1a5276"],
  CIMB: ["#b71c1c", "#e53935"],
};

// ─── Default palette (light / neutral) ───────────────────────────────────────

const DEF = {
  gold:      "#c4954a",
  goldLight: "#ddb96e",
  ivory:     "#fafaf8",
  cream:     "#f4ece0",
  text:      "#1e1a14",
  muted:     "#8a7e72",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  html { scroll-behavior: smooth; }
  .lh-root, .lh-root *, .lh-root *::before, .lh-root *::after { box-sizing: border-box; }
  .lh-root { -webkit-font-smoothing: antialiased; }
  @keyframes lh-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .lh-gold-shimmer {
    background: linear-gradient(90deg, #a87830 0%, #ddb96e 40%, #c4954a 50%, #ddb96e 60%, #a87830 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lh-shimmer 5s linear infinite;
  }
  .lh-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--lh-gold, #c4954a), transparent);
    margin: 0 auto;
  }
  .lh-story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
  .lh-story-html li { margin: 0.15em 0; }
  .lh-story-html strong, .lh-story-html b { font-weight: 600; }
  .lh-story-html em, .lh-story-html i { font-style: italic; }
  .lh-story-html p { margin: 0.4em 0; }
`;

// ─── Animation ────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

function AnimInView({
  children, delay = 0, y = 24, className, style,
}: {
  children: React.ReactNode; delay?: number; y?: number;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({
  eyebrow, title, gold, text, fontH,
}: {
  eyebrow: string; title: string; gold: string; text: string; fontH: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
      <AnimInView delay={0}>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.34em", textTransform: "uppercase", color: gold, fontFamily: "'Cinzel', serif", marginBottom: "0.6rem" }}>
          {eyebrow}
        </p>
      </AnimInView>
      <AnimInView delay={0.08}>
        <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "clamp(1.7rem, 5vw, 2.3rem)", fontWeight: 300, color: text, lineHeight: 1.15 }}>
          {title}
        </p>
      </AnimInView>
      <AnimInView delay={0.18}>
        <div className="lh-divider" style={{ width: "48px", marginTop: "1rem", "--lh-gold": gold } as React.CSSProperties} />
      </AnimInView>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  heroUrl, gold, ivory, text, fontH, coupleLabel, invLabel, t,
}: {
  heroUrl?: string; gold: string; ivory: string; text: string; fontH: string;
  coupleLabel: string; invLabel: string; t: Translations;
}) {
  return (
    <section style={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "-12%", transform: "scale(1.12)" }}>
        {heroUrl ? (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${heroUrl}')`, backgroundSize: "cover", backgroundPosition: "center 30%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(30,26,20,0.1) 0%, rgba(30,26,20,0.48) 60%, rgba(30,26,20,0.82) 100%)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${ivory} 0%, #e8ddd0 100%)` }} />
        )}
      </div>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, zIndex: 10 }} />

      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 2rem" }}>
        <AnimInView delay={0}>
          <div className="lh-divider" style={{ width: "68px", marginBottom: "1.8rem", "--lh-gold": gold } as React.CSSProperties} />
        </AnimInView>
        <AnimInView delay={0.1}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.7)" : gold, marginBottom: "1rem" }}>
            {invLabel}
          </p>
        </AnimInView>
        <AnimInView delay={0.18} y={28}>
          <h1 style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "clamp(3.2rem, 13vw, 6.2rem)", fontWeight: 300, lineHeight: 1.08, color: heroUrl ? "#fff" : text, letterSpacing: "-0.01em" }}>
            {coupleLabel}
          </h1>
        </AnimInView>
        <AnimInView delay={0.3}>
          <div className="lh-divider" style={{ width: "52px", margin: "1.6rem auto", "--lh-gold": gold } as React.CSSProperties} />
        </AnimInView>
      </div>

      <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.35)" : DEF.muted }}>
            {t.scroll}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Couple Section (2 profile cards) ─────────────────────────────────────────

function CoupleSection({
  profile, gold, ivory, cream, text, fontH, fontB, t,
}: {
  profile: NonNullable<Profile>; gold: string; ivory: string; cream: string;
  text: string; fontH: string; fontB: string; t: Translations;
}) {
  function ProfileCard({
    name, nickname, parents, photo, showPhoto, from,
  }: {
    name: string; nickname: string; parents: string;
    photo: string | null; showPhoto: boolean; from: "left" | "right";
  }) {
    return (
      <SlideReveal from={from}>
        <motion.div
          whileHover={{ y: -4, boxShadow: `0 20px 48px ${gold}1a`, transition: { duration: 0.3 } }}
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "1.5rem 1rem",
            textAlign: "center",
            border: `1px solid ${gold}22`,
            boxShadow: `0 4px 24px rgba(30,26,20,0.07)`,
            height: "100%",
          }}
        >
          {showPhoto && (
            <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: "14px", overflow: "hidden", marginBottom: "1rem", border: `1px solid ${gold}18` }}>
              {photo ? (
                <img
                  src={photo} alt={name} loading="lazy" decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, ${cream}, ${gold}18)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2.5rem" }}>🤍</span>
                </div>
              )}
            </div>
          )}
          <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.2rem", fontWeight: 400, color: text, marginBottom: "0.2rem", lineHeight: 1.2 }}>
            {name}
          </p>
          {nickname && nickname !== name && (
            <p style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "0.78rem", fontStyle: "italic", color: gold, marginBottom: "0.5rem" }}>
              {nickname}
            </p>
          )}
          {parents && (
            <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, lineHeight: 1.65, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>
              {parents}
            </p>
          )}
        </motion.div>
      </SlideReveal>
    );
  }

  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${cream} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_couple} title={t.title_couple} gold={gold} text={text} fontH={fontH} />

        {/* Two profile cards side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "3rem" }}>
          <ProfileCard
            name={profile.groomName}
            nickname={profile.groomNickname}
            parents={profile.groomParents}
            photo={profile.groomPhoto}
            showPhoto={profile.showGroomPhoto}
            from="left"
          />
          <ProfileCard
            name={profile.brideName}
            nickname={profile.brideNickname}
            parents={profile.brideParents}
            photo={profile.bridePhoto}
            showPhoto={profile.showBridePhoto}
            from="right"
          />
        </div>

        {/* Opening quote */}
        {profile.openingQuote && (
          <AnimInView delay={0.1}>
            <div style={{ borderTop: `1px solid ${gold}28`, paddingTop: "2.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.1rem", fontStyle: "italic", fontWeight: 300, lineHeight: 1.8, color: text, opacity: 0.65 }}>
                &ldquo;{profile.openingQuote}&rdquo;
              </p>
              {profile.openingQuoteBy && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.22em", color: gold, marginTop: "0.8rem", textTransform: "uppercase" }}>
                  — {profile.openingQuoteBy}
                </p>
              )}
            </div>
          </AnimInView>
        )}

        {/* Story */}
        {profile.story && (
          <AnimInView delay={0.15}>
            <div style={{ borderTop: `1px solid ${gold}22`, paddingTop: "2.5rem", marginTop: "2rem" }}>
              {profile.showStoryTitle && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: gold, marginBottom: "1.2rem", textAlign: "center" }}>
                  {profile.storyTitle?.trim() || t.ourStory}
                </p>
              )}
              <div
                className="lh-story-html"
                style={{ fontSize: "0.88rem", lineHeight: 1.9, color: text, opacity: 0.58, fontFamily: `'${fontB}', 'Jost', sans-serif` }}
                dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
              />
            </div>
          </AnimInView>
        )}
      </div>
    </section>
  );
}

// ─── Events Section (timeline design) ─────────────────────────────────────────

function EventsSection({
  events, gold, ivory, cream, text, fontH, fontB, t, showMap,
}: {
  events: Props["client"]["events"]; gold: string; ivory: string; cream: string;
  text: string; fontH: string; fontB: string; t: Translations; showMap: boolean;
}) {
  if (!events.length) return null;

  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${cream} 0%, ${ivory} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_event} title={t.title_event} gold={gold} text={text} fontH={fontH} />

        <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
          {/* Animated vertical timeline line */}
          <motion.div
            style={{
              position: "absolute",
              left: "7px",
              top: 0,
              width: "2px",
              height: "100%",
              background: `linear-gradient(to bottom, ${gold}, ${gold}33)`,
              transformOrigin: "top center",
            }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: false, amount: 0.05 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
            {events.map((ev, i) => (
              <AnimInView key={ev.id} delay={i * 0.08} y={20}>
                <div style={{ position: "relative" }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute",
                    left: "-1.75rem",
                    top: "1.5rem",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: gold,
                    border: `3px solid ${cream}`,
                    boxShadow: `0 0 0 3px ${gold}33`,
                    zIndex: 1,
                    transform: "translateX(-50%)",
                    marginLeft: "-1px",
                  }} />

                  <motion.div
                    whileHover={{ y: -3, boxShadow: `0 16px 40px ${gold}18`, transition: { duration: 0.3 } }}
                    style={{ background: "#fff", borderRadius: "20px", padding: "1.6rem", border: `1px solid ${gold}22`, boxShadow: `0 4px 20px rgba(30,26,20,0.07)` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.2rem" }}>
                      <div style={{ width: "3px", height: "28px", borderRadius: "99px", background: `linear-gradient(to bottom, ${gold}, ${gold}44)`, flexShrink: 0 }} />
                      <h3 style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.4rem", fontWeight: 400, color: text, lineHeight: 1.2 }}>
                        {ev.label || EVENT_LABEL[ev.type] || ev.type}
                      </h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {ev.date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <Calendar size={12} color={gold} style={{ flexShrink: 0 }} />
                          <p style={{ fontSize: "0.82rem", color: text, opacity: 0.65, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{formatDate(ev.date)}</p>
                        </div>
                      )}
                      {(ev.timeStart || ev.timeEnd) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <Clock size={12} color={gold} style={{ flexShrink: 0 }} />
                          <p style={{ fontSize: "0.82rem", color: text, opacity: 0.65, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>
                            {ev.timeStart}{ev.timeEnd && ` – ${ev.timeEnd}`} WIB
                          </p>
                        </div>
                      )}
                      {ev.venueName && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                          <MapPin size={12} color={gold} style={{ marginTop: "2px", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: "0.82rem", fontWeight: 500, color: text, opacity: 0.82, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{ev.venueName}</p>
                            {ev.venueAddress && (
                              <p style={{ fontSize: "0.72rem", color: text, opacity: 0.38, marginTop: "0.18rem", lineHeight: 1.55, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{ev.venueAddress}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {showMap && ev.mapsUrl && ev.venueName && (
                      <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                        <iframe
                          src={getMapEmbedUrl(ev.mapsUrl, ev.venueName, ev.venueAddress)}
                          width="100%" height="190"
                          style={{ display: "block", border: "none" }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={ev.venueName}
                        />
                      </div>
                    )}

                    {ev.mapsUrl && (
                      <a
                        href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "1.2rem", padding: "0.62rem", border: `1px solid ${gold}55`, borderRadius: "9999px", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: gold, textDecoration: "none", fontFamily: "'Cinzel', serif" }}
                        onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = gold; el.style.color = "#fff"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = gold; }}
                      >
                        <MapPin size={10} />
                        {t.viewLocation}
                      </a>
                    )}
                  </motion.div>
                </div>
              </AnimInView>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section (swipe carousel) ─────────────────────────────────────────

const CARD_W = 260;
const CARD_GAP = 14;
const CAROUSEL_STEP = CARD_W + CARD_GAP;

function GallerySection({
  galleries, gold, cream, text, fontH, t,
}: {
  galleries: Props["client"]["galleries"]; gold: string; cream: string;
  text: string; fontH: string; t: Translations;
}) {
  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");
  const count = photos.length;
  const extended = count > 1 ? [photos[count - 1], ...photos, photos[0]] : photos;

  const [idx, setIdx] = useState(count > 1 ? 1 : 0);
  const [animated, setAnimated] = useState(true);
  const pointerStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!animated) {
      const raf = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [animated]);

  if (!photos.length) return null;

  function onTransitionEnd(e: React.TransitionEvent) {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    if (count <= 1) return;
    if (idx === 0) { setAnimated(false); setIdx(count); }
    else if (idx === extended.length - 1) { setAnimated(false); setIdx(1); }
  }

  return (
    <section style={{ padding: "6rem 0", background: `linear-gradient(160deg, ${cream} 0%, #f9f4ee 100%)`, overflow: "hidden" }}>
      <div style={{ padding: "0 1.5rem", maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_gallery} title={t.title_gallery} gold={gold} text={text} fontH={fontH} />
      </div>

      <div
        style={{ overflow: "hidden", cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
        onPointerDown={(e) => { pointerStartX.current = e.clientX; dragging.current = false; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 5) dragging.current = true; }}
        onPointerUp={(e) => {
          if (pointerStartX.current === null) return;
          const dx = e.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (!dragging.current || Math.abs(dx) < 30) return;
          dx < 0 ? setIdx((i) => i + 1) : setIdx((i) => i - 1);
        }}
      >
        <div
          style={{
            display: "flex", gap: `${CARD_GAP}px`,
            paddingLeft: `calc(50vw - ${CARD_W / 2}px)`,
            paddingRight: `calc(50vw - ${CARD_W / 2}px)`,
            transform: `translateX(-${idx * CAROUSEL_STEP}px)`,
            transition: animated ? "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((photo, i) => {
            const isCurrent = i === idx;
            return (
              <div key={`${photo.id}-${i}`} style={{ flexShrink: 0, width: `${CARD_W}px`, borderRadius: "16px", overflow: "hidden", pointerEvents: "none", opacity: isCurrent ? 1 : 0.38, transform: isCurrent ? "scale(1)" : "scale(0.85)", boxShadow: isCurrent ? `0 24px 48px ${gold}28` : "0 4px 12px rgba(30,26,20,0.05)", transition: animated ? "opacity 400ms ease, transform 400ms ease, box-shadow 400ms ease" : "none" }}>
                <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                  <img src={photo.url} alt="" draggable={false} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── RSVP Section ──────────────────────────────────────────────────────────────

function RSVPSection({
  clientId, guest, token, gold, ivory, cream, text, fontH, fontB, t, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; gold: string; ivory: string;
  cream: string; text: string; fontH: string; fontB: string; t: Translations;
  onConfirmed?: (s: "HADIR" | "TIDAK_HADIR") => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">((guest.rsvp?.status as "HADIR" | "TIDAK_HADIR") || "HADIR");
  const [pax, setPax] = useState((guest.rsvp as any)?.paxCount ?? guest.maxPax);
  const [msg, setMsg] = useState((guest.rsvp as any)?.message || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, guestId: guest.id, token, name: guest.name, paxCount: pax, status, message: msg }) });
    if (res.ok) { setDone(true); onConfirmed?.(status); }
    setSaving(false);
  }

  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${cream} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_rsvp} title={t.title_rsvp} gold={gold} text={text} fontH={fontH} />
        <AnimInView delay={0.1}>
          {done ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#fff", borderRadius: "24px", border: `1px solid ${gold}22`, boxShadow: `0 8px 40px ${gold}0f` }}>
              <motion.div animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 0.6, delay: 0.1 }} style={{ width: 56, height: 56, borderRadius: "50%", background: `${gold}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
                <Heart size={24} color={gold} />
              </motion.div>
              <p style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "1.4rem", fontWeight: 400, color: text, marginBottom: "0.4rem" }}>{t.thankYou}</p>
              <p style={{ fontSize: "0.82rem", color: text, opacity: 0.45, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{t.confirmed}</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "24px", padding: "1.8rem", border: `1px solid ${gold}22`, boxShadow: `0 6px 32px ${gold}0c` }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.4rem" }}>
                {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                  <motion.button key={s} onClick={() => setStatus(s)} whileTap={{ scale: 0.96 }}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "9999px", border: `1px solid ${status === s ? gold : gold + "28"}`, background: status === s ? `${gold}18` : "transparent", color: status === s ? gold : `${text}55`, fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel', serif", transition: "all 0.25s ease" }}>
                    {s === "HADIR" ? t.attending : t.notAttending}
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {status === "HADIR" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: "1.2rem" }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem" }}>{t.guestCount}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPax((p: number) => Math.max(1, p - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${gold}44`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</motion.button>
                      <span style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "1.6rem", fontWeight: 300, color: text, minWidth: "1.8rem", textAlign: "center" }}>{pax}</span>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPax((p: number) => Math.min(guest.maxPax, p + 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${gold}44`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</motion.button>
                      <span style={{ fontSize: "0.72rem", color: text, opacity: 0.38, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{t.max} {guest.maxPax}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder={t.messagePlaceholder} style={{ width: "100%", background: cream, border: `1px solid ${gold}22`, borderRadius: "14px", padding: "0.8rem 1rem", fontSize: "0.82rem", color: text, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: `'${fontB}', 'Jost', sans-serif`, lineHeight: 1.65 }} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving} style={{ width: "100%", marginTop: "1rem", padding: "0.95rem", background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`, backgroundSize: "200% 100%", color: "#1e1a14", border: "none", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel', serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? t.sending : t.confirmBtn}
              </motion.button>
            </div>
          )}
        </AnimInView>
      </div>
    </section>
  );
}

function RSVPPlaceholder({ gold, ivory, cream, text, fontH, t }: { gold: string; ivory: string; cream: string; text: string; fontH: string; t: Translations }) {
  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${cream} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_rsvp} title={t.title_rsvp} gold={gold} text={text} fontH={fontH} />
        <AnimInView delay={0.1}>
          <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#fff", borderRadius: "24px", border: `1px solid ${gold}22` }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${gold}14`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
              <LockKeyhole size={20} color={gold} />
            </div>
            <p style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "1.15rem", color: text, marginBottom: "0.4rem" }}>{t.confirmBtn}</p>
            <p style={{ fontSize: "0.78rem", color: text, opacity: 0.42, lineHeight: 1.65 }}>{t.rsvpLocked}</p>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Wishes Section ────────────────────────────────────────────────────────────

function WishesSection({
  clientId, initialWishes, guestName, guestId, gold, ivory, cream, text, fontH, fontB, t,
}: {
  clientId: string; initialWishes: Props["client"]["wishes"]; guestName?: string; guestId?: string;
  gold: string; ivory: string; cream: string; text: string; fontH: string; fontB: string; t: Translations;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName || "");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    const res = await fetch("/api/wishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, name: name || "Tamu", message: msg, guestId }) });
    if (res.ok) { const data = await res.json(); setWishes((p) => [data, ...p]); setMsg(""); setSent(true); setTimeout(() => setSent(false), 3000); }
    setSending(false);
  }

  const inputBase: React.CSSProperties = { width: "100%", background: "#fff", border: `1px solid ${gold}22`, borderRadius: "14px", padding: "0.8rem 1rem", fontSize: "0.82rem", color: text, outline: "none", boxSizing: "border-box", fontFamily: `'${fontB}', 'Jost', sans-serif` };

  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${cream} 0%, ${ivory} 100%)` }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_wishes} title={t.title_wishes} gold={gold} text={text} fontH={fontH} />
        <AnimInView delay={0.1}>
          <div style={{ background: cream, borderRadius: "22px", padding: "1.5rem", marginBottom: "1.5rem", border: `1px solid ${gold}1a`, boxShadow: `0 4px 20px rgba(30,26,20,0.05)` }}>
            {!guestName && <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} style={{ ...inputBase, marginBottom: "0.75rem" }} />}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder={t.wishPlaceholder} style={{ ...inputBase, resize: "none", marginBottom: "0.75rem", lineHeight: 1.65 }} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={send} disabled={sending || !msg.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem", background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`, color: "#1e1a14", border: "none", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel', serif", opacity: sending || !msg.trim() ? 0.5 : 1 }}>
              <Send size={12} />
              {sent ? t.sent : sending ? t.sending : t.sendWish}
            </motion.button>
          </div>
        </AnimInView>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
          {wishes.length === 0 && (
            <p style={{ textAlign: "center", padding: "2.5rem 0", fontFamily: `'${fontH}', Georgia, serif`, fontSize: "1rem", fontStyle: "italic", color: text, opacity: 0.32 }}>{t.beFirst}</p>
          )}
          {wishes.map((w, i) => (
            <AnimInView key={w.id} delay={Math.min(i * 0.04, 0.2)}>
              <motion.div whileHover={{ y: -2, transition: { duration: 0.22 } }} style={{ background: "#fff", borderRadius: "16px", padding: "1.1rem 1.3rem", border: `1px solid ${gold}18`, boxShadow: `0 2px 12px rgba(30,26,20,0.05)` }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.1em", color: gold, marginBottom: "0.35rem", textTransform: "uppercase" }}>{w.name}</p>
                <p style={{ fontSize: "0.84rem", lineHeight: 1.7, color: text, opacity: 0.65, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{w.message}</p>
                {w.reply && (
                  <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: `1px solid ${gold}1a`, paddingLeft: "0.85rem", borderLeft: `2px solid ${gold}55` }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.54rem", letterSpacing: "0.16em", color: gold, marginBottom: "0.25rem", textTransform: "uppercase" }}>{t.reply}</p>
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.65, color: text, opacity: 0.52, fontStyle: "italic", fontFamily: `'${fontH}', Georgia, serif` }}>{w.reply}</p>
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
  gifts, gold, ivory, cream, text, fontH, fontB, t,
}: {
  gifts: Props["client"]["gifts"]; gold: string; ivory: string; cream: string;
  text: string; fontH: string; fontB: string; t: Translations;
}) {
  const active = gifts.filter((g) => g.isActive);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  if (!active.length) return null;

  const banks    = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, val: string) {
    await navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  }

  return (
    <section style={{ padding: "6rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${cream} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_gift} title={t.title_gift} gold={gold} text={text} fontH={fontH} />
        <AnimInView delay={0.05}>
          <p style={{ textAlign: "center", fontFamily: `'${fontH}', Georgia, serif`, fontSize: "0.98rem", fontStyle: "italic", fontWeight: 300, color: text, opacity: 0.48, marginBottom: "2rem", lineHeight: 1.7 }}>{t.giftNote}</p>
        </AnimInView>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {banks.map((gift, i) => {
            const [from, to] = getBankGradient(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <AnimInView key={gift.id} delay={i * 0.06}>
                <motion.div whileHover={{ y: -5, transition: { duration: 0.3 } }} style={{ borderRadius: "20px", overflow: "hidden", position: "relative", aspectRatio: "1.586/1", minHeight: "180px", background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
                  <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", letterSpacing: "0.04em" }}>{gift.bankName}</span>
                      <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>{t.transferLabel}</span>
                    </div>
                    <p style={{ fontFamily: "monospace", color: "#fff", fontSize: "1rem", letterSpacing: "0.22em" }}>{(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.52rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>{t.accountName}</p>
                        <p style={{ color: "#fff", fontSize: "0.8rem", fontWeight: 500, textTransform: "uppercase" }}>{gift.accountName}</p>
                      </div>
                      <button onClick={() => copy(key, gift.accountNumber || "")} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.7rem", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.62rem", cursor: "pointer" }}>
                        {copiedId === key ? <><Check size={10} /> {t.copied}</> : <><Copy size={10} /> {t.copy}</>}
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
              <AnimInView key={gift.id} delay={i * 0.06}>
                <motion.div whileHover={{ y: -3 }} style={{ background: "#fff", borderRadius: "16px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "1rem", border: `1px solid ${gold}22` }}>
                  <div style={{ padding: "0.72rem", borderRadius: "12px", background: `${gold}16`, flexShrink: 0 }}><Wallet size={17} color={gold} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.54rem", color: text, opacity: 0.38, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>{t.eWallet}</p>
                    <p style={{ fontWeight: 600, color: text, fontSize: "0.9rem", fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{gift.ewalletType}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.8rem", color: text, opacity: 0.52 }}>{gift.ewalletNumber}</p>
                  </div>
                  <button onClick={() => copy(key, gift.ewalletNumber || "")} style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.4, padding: "4px" }}>
                    {copiedId === key ? <Check size={14} color={gold} /> : <Copy size={14} />}
                  </button>
                </motion.div>
              </AnimInView>
            );
          })}
          {qrisList.map((gift, i) => (
            <AnimInView key={gift.id} delay={i * 0.06}>
              <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ padding: "0.72rem", borderRadius: "12px", background: `${gold}16` }}><QrCode size={17} color={gold} /></div>
                    <div>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.54rem", color: text, opacity: 0.38, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>{t.qris}</p>
                      <p style={{ fontWeight: 600, color: text, fontSize: "0.88rem", fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)} style={{ padding: "0.45rem 1rem", border: `1px solid ${gold}55`, borderRadius: "9999px", background: "transparent", color: gold, fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase" }}>
                    {qrisOpen === gift.id ? t.closeQr : t.viewQr}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {qrisOpen === gift.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: `1px solid ${gold}18`, padding: "1.3rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img src={gift.qrisImage!} alt="QRIS" loading="lazy" decoding="async" style={{ maxWidth: "170px", width: "100%", borderRadius: "12px" }} />
                      <p style={{ marginTop: "0.6rem", fontFamily: `'${fontB}', 'Jost', sans-serif`, fontSize: "0.68rem", color: text, opacity: 0.38 }}>{t.scanToTransfer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimInView>
          ))}
        </div>
        <AnimInView delay={0.15}>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Gift size={17} color={gold} style={{ opacity: 0.32, margin: "0 auto 0.6rem", display: "block" }} />
            <p style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "0.86rem", fontStyle: "italic", color: text, opacity: 0.3 }}>{t.giftThanks}</p>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Closing Section ───────────────────────────────────────────────────────────

function ClosingSection({ coupleLabel, gold, cream, text, fontH, t }: { coupleLabel: string; gold: string; cream: string; text: string; fontH: string; t: Translations }) {
  return (
    <footer style={{ padding: "4rem 2rem", textAlign: "center", borderTop: `1px solid ${gold}28`, background: cream }}>
      <AnimInView>
        <p style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "1.5rem", fontStyle: "italic", color: gold, marginBottom: "0.5rem" }}>{coupleLabel}</p>
      </AnimInView>
      <AnimInView delay={0.1}>
        <p style={{ fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", color: DEF.muted }}>{t.footerThanks}</p>
      </AnimInView>
      <AnimInView delay={0.2}>
        <div style={{ height: "1px", width: "36px", background: `${gold}44`, margin: "1.5rem auto" }} />
      </AnimInView>
      <AnimInView delay={0.28}>
        <p style={{ fontSize: "0.58rem", color: DEF.muted, opacity: 0.38 }}>{t.madeWith}</p>
      </AnimInView>
    </footer>
  );
}

// ─── Main Template ─────────────────────────────────────────────────────────────

export function LuckyHanoiTemplate({ guest, client, token }: Props) {
  const [coverGone, setCoverGone] = useState(false);
  const [lang, setLang] = useGuestLanguage("en");
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );
  const t: Translations = TR[lang];

  const profile    = client.weddingProfile;
  const music      = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const showCountdown    = !!client.theme?.showCountdown;
  const showMap          = client.theme?.showMap !== false;
  const barcodeVisibility = (client.theme as any)?.barcodeVisibility ?? "AFTER_RSVP";

  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const heroUrl = client.galleries.find((g) => g.type === "HERO")?.url
    || client.galleries.find((g) => g.type === "COVER")?.url;

  const th      = client.theme;
  const gold    = th?.primaryColor   || DEF.gold;
  const ivory   = th?.bgColor        || DEF.ivory;
  const cream   = th?.secondaryColor || DEF.cream;
  const text    = th?.textColor      || DEF.text;
  const fontH   = th?.fontHeading    || "Cormorant Garamond";
  const fontB   = th?.fontBody       || "Jost";

  const invLabel   = INVITATION_LABEL[client.clientType] || "The Wedding Of";
  const groomNick  = profile?.groomNickname || profile?.groomName || "Groom";
  const brideNick  = profile?.brideNickname || profile?.brideName || "Bride";
  const coupleLabel = `${groomNick} & ${brideNick}`;

  const playMusicRef = useRef<(() => void) | null>(null);
  const anchorRef    = useRef<HTMLDivElement>(null);

  function handleOpen() {
    setCoverGone(true);
    window.scrollTo(0, 0);
    playMusicRef.current?.();
    // Auto-scroll past hero after cover fades out + hero renders (~900ms)
    setTimeout(() => {
      const targetY = anchorRef.current?.offsetTop ?? window.innerHeight;
      const startY  = window.scrollY;
      const distance = targetY - startY;
      if (distance <= 0) return;
      const duration  = 1100;
      const startTime = performance.now();
      function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4); }
      function step(now: number) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeOutQuart(progress));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, 900);
  }

  return (
    <>
      <style>{`
        body { background-color: ${ivory}; color: ${text}; margin: 0; -webkit-font-smoothing: antialiased; font-family: '${fontB}', Jost, sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${gold}44; border-radius: 9999px; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playMusicRef.current = fn; }} />
      )}

      {/* Language toggle (visible after cover opens) */}
      {coverGone && (
        <div style={{ position: "fixed", bottom: "5rem", right: "1rem", zIndex: 10000, display: "flex", borderRadius: "9999px", overflow: "hidden", border: `1px solid ${gold}44`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          {(["id", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: "0.4rem 0.72rem", fontSize: "0.62rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase", background: lang === l ? gold : ivory, color: lang === l ? "#fff" : gold, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Hanoi Cover */}
      <AnimatePresence>
        {!coverGone && (
          <HanoiCover
            groomNickname={groomNick}
            brideNickname={brideNick}
            groomPhoto={profile?.groomPhoto}
            bridePhoto={profile?.bridePhoto}
            guestName={guest?.name}
            invitationLabel={invLabel}
            primaryColor={gold}
            bgColor={ivory}
            textColor={text}
            fontHeading={fontH}
            lang={lang === "en" ? "EN" : "ID"}
            onLangToggle={() => setLang((l) => l === "en" ? "id" : "en")}
            onOpen={handleOpen}
          />
        )}
      </AnimatePresence>

      {/* Main Invitation Content */}
      <motion.div
        className="lh-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: coverGone ? 1 : 0 }}
        transition={{ duration: 0.75 }}
        style={{ minHeight: "100dvh", position: "relative", background: ivory }}
      >
        <style>{GLOBAL_CSS}</style>

        <div style={{ position: "relative", zIndex: 1 }}>
          {coverGone && (
            <>
              <HeroSection
                heroUrl={heroUrl}
                gold={gold} ivory={ivory} text={text} fontH={fontH}
                coupleLabel={coupleLabel} invLabel={invLabel} t={t}
              />

              {/* Anchor for auto-scroll target */}
              <div ref={anchorRef} aria-hidden style={{ height: 0 }} />

              {/* Countdown */}
              {showCountdown && countdownTimeLeft && (
                <section style={{ padding: "4rem 1.5rem", background: cream, textAlign: "center" }}>
                  <AnimInView>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.32em", textTransform: "uppercase", color: gold, marginBottom: "1.8rem" }}>{t.countdownLabel}</p>
                  </AnimInView>
                  <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                    {[
                      { v: countdownTimeLeft.days,    l: t.days },
                      { v: countdownTimeLeft.hours,   l: t.hours },
                      { v: countdownTimeLeft.minutes, l: t.minutes },
                      { v: countdownTimeLeft.seconds, l: t.seconds },
                    ].map(({ v, l }, i) => (
                      <AnimInView key={l} delay={i * 0.07}>
                        <div style={{ textAlign: "center", minWidth: "3rem" }}>
                          <div style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "2.6rem", fontWeight: 300, color: gold, lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", color: DEF.muted, marginTop: "0.4rem" }}>{l}</div>
                        </div>
                      </AnimInView>
                    ))}
                  </div>
                </section>
              )}

              {sectionKeys.includes("COUPLE") && profile && (
                <CoupleSection
                  profile={profile} gold={gold} ivory={ivory} cream={cream}
                  text={text} fontH={fontH} fontB={fontB} t={t}
                />
              )}

              {(profile as any)?.attentionContent && (
                <AttentionSection
                  title={(profile as any).attentionTitle}
                  content={(profile as any).attentionContent}
                  titleEn={(profile as any).attentionTitleEn}
                  contentEn={(profile as any).attentionContentEn}
                  lang={lang === "en" ? "EN" : "ID"}
                  primaryColor={gold}
                  bgColor={ivory}
                  textColor={text}
                  fontBody={fontB}
                />
              )}

              {sectionKeys.includes("EVENT") && (
                <EventsSection
                  events={client.events} gold={gold} ivory={ivory} cream={cream}
                  text={text} fontH={fontH} fontB={fontB} t={t} showMap={showMap}
                />
              )}

              {sectionKeys.includes("GALLERY") && (
                <GallerySection
                  galleries={client.galleries} gold={gold} cream={cream}
                  text={text} fontH={fontH} t={t}
                />
              )}

              {sectionKeys.includes("RSVP") &&
                (token && guest ? (
                  <RSVPSection
                    clientId={client.id} guest={guest} token={token}
                    gold={gold} ivory={ivory} cream={cream}
                    text={text} fontH={fontH} fontB={fontB} t={t}
                    onConfirmed={(s) => setConfirmedRsvpStatus(s)}
                  />
                ) : (
                  <RSVPPlaceholder gold={gold} ivory={ivory} cream={cream} text={text} fontH={fontH} t={t} />
                ))}

              {guest?.barcodeChurch && (
                barcodeVisibility === "ALWAYS" ||
                (barcodeVisibility === "AFTER_RSVP" && confirmedRsvpStatus === "HADIR")
              ) && (
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

              {sectionKeys.includes("WISHES") && (
                <WishesSection
                  clientId={client.id} initialWishes={client.wishes}
                  guestName={guest?.name} guestId={guest?.id}
                  gold={gold} ivory={ivory} cream={cream}
                  text={text} fontH={fontH} fontB={fontB} t={t}
                />
              )}

              {sectionKeys.includes("GIFT") && (
                <GiftSection
                  gifts={client.gifts} gold={gold} ivory={ivory} cream={cream}
                  text={text} fontH={fontH} fontB={fontB} t={t}
                />
              )}

              <ClosingSection coupleLabel={coupleLabel} gold={gold} cream={cream} text={text} fontH={fontH} t={t} />
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
