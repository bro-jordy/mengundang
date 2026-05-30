"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform,
} from "framer-motion";
import { MapPin, Clock, Calendar, Copy, Check, Wallet, QrCode, Gift, Send, Heart, LockKeyhole } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection } from "../../sections/BarcodeSection";
import type { Rsvp } from "@/types/prisma.types";
import { formatDate } from "@/lib/utils";

function storyToHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (s.includes("<")) return s;
  return s.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

function useCountdown(target: Date | null) {
  const targetMs = target?.getTime() ?? null;
  const [t, setT] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
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
    theme: { primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null } | null;
  };
  token: string | null;
}

const EVENT_LABEL: Record<string, string> = {
  AKAD: "Akad Nikah", PEMBERKATAN: "Pemberkatan Perkawinan",
  RESEPSI: "Resepsi", AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit", LAMARAN: "Lamaran",
};

const INVITATION_LABEL: Record<string, string> = {
  WEDDING: "The Wedding Of",
  SANGJIT: "Sangjit Ceremony Of",
  LAMARAN: "Lamaran",
};

// ─── Pearl palette ────────────────────────────────────────────────────────────
// Default palette — overridden by theme if set
const PEARL = {
  gold: "#c9a96e",
  blush: "#f2e4d8",
  ivory: "#fdf8f3",
  champagne: "#f5ede0",
  rose: "#d4a5a5",
  text: "#3d2e28",
  muted: "#8a7060",
};

// ─── FadeSection helper ───────────────────────────────────────────────────────
// whileInView + once:true → plays once, stays visible forever after

function FadeSection({ children, className, style, delay = 0 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export function PearlTemplate({ guest, client, token }: Props) {
  const [opened, setOpened] = useState(false);
  const [coverGone, setCoverGone] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const profile = client.weddingProfile;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const showCountdown = !!client.theme?.showCountdown;
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const coverImage = client.galleries.find((g) => g.type === "COVER");
  const heroGallery = client.galleries.find((g) => g.type === "HERO");
  const bgImage = client.galleries.find((g) => g.type === "BACKGROUND");
  const heroUrl = heroGallery?.url || coverImage?.url;

  const th = client.theme;
  const gold = th?.primaryColor || PEARL.gold;
  const ivory = th?.bgColor || PEARL.ivory;
  const champagne = th?.secondaryColor || PEARL.champagne;
  const text = th?.textColor || PEARL.text;
  const fontH = th?.fontHeading || "Cormorant Garamond";
  const fontB = th?.fontBody || "Lato";

  const invLabel = INVITATION_LABEL[client.clientType] || "The Wedding Of";
  const coupleLabel = profile
    ? `${profile.groomNickname || profile.groomName} & ${profile.brideNickname || profile.brideName}`
    : "Groom & Bride";

  const playMusicRef = useRef<(() => void) | null>(null);

  function handleOpen() {
    setOpened(true);
    window.scrollTo(0, 0);
    playMusicRef.current?.();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,300&display=swap');
        body { background-color: ${ivory}; color: ${text}; margin:0; -webkit-font-smoothing:antialiased; font-family:'${fontB}',Lato,sans-serif; }
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${gold}44;border-radius:9999px;}
        .story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .story-html li { margin: 0.15em 0; }
        .story-html strong, .story-html b { font-weight: 600; }
        .story-html em, .story-html i { font-style: italic; }
        .story-html p { margin: 0.4em 0; }
        .story-html p:first-child { margin-top: 0; }
        .story-html p:last-child { margin-bottom: 0; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playMusicRef.current = fn; }} />
      )}

      {/* ── COVER ── */}
      <AnimatePresence>
        {!coverGone && (
          <motion.div
            key="cover"
            initial={{ opacity: 1 }}
            animate={{ opacity: opened ? 0 : 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => { if (opened) setCoverGone(true); }}
            style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: opened ? "none" : "auto" }}
          >
            {/* Cover background */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: heroUrl ? `url('${heroUrl}')` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              backgroundColor: heroUrl ? undefined : champagne,
            }} />
            {/* Gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: heroUrl
                ? "linear-gradient(180deg,rgba(253,248,243,0.15) 0%,rgba(61,46,40,0.55) 60%,rgba(61,46,40,0.85) 100%)"
                : `linear-gradient(160deg, ${champagne} 0%, ${ivory} 100%)`,
            }} />

            {/* Ornamental top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

            <div style={{ position: "relative", zIndex: 10, height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 2rem" }}>
              {/* Decorative line */}
              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 1, ease: [0.22,1,0.36,1] }}
                style={{ height: "1px", width: "80px", background: `linear-gradient(90deg,transparent,${gold},transparent)`, marginBottom: "1.5rem" }} />

              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
                style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "0.85rem", letterSpacing: "0.25em", color: heroUrl ? "rgba(255,255,255,0.75)" : gold, marginBottom: "0.75rem", fontStyle: "italic" }}>
                {invLabel}
              </motion.p>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.9, ease: [0.22,1,0.36,1] }}
                style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "clamp(2.5rem,8vw,4rem)", fontWeight: 300, lineHeight: 1.1, color: heroUrl ? "#fff" : text, marginBottom: "0.5rem" }}>
                {coupleLabel}
              </motion.h1>

              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
                style={{ height: "1px", width: "60px", background: `linear-gradient(90deg,transparent,${gold},transparent)`, margin: "1.5rem auto" }} />

              {guest && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
                  style={{ marginBottom: "2rem" }}>
                  <p style={{ fontSize: "0.75rem", color: heroUrl ? "rgba(255,255,255,0.6)" : PEARL.muted, letterSpacing: "0.15em", marginBottom: "0.25rem" }}>Kepada Yth.</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 500, color: heroUrl ? "#fff" : text }}>{guest.name}</p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpen}
                style={{
                  background: `linear-gradient(135deg, ${gold}, #e8c98a, ${gold})`,
                  backgroundSize: "200% 100%",
                  color: "#3d2e28",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "14px 52px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                  fontFamily: `'${fontB}',Lato,sans-serif`,
                  boxShadow: `0 8px 32px ${gold}44`,
                }}
              >
                BUKA UNDANGAN
              </motion.button>

              {/* Ornamental bottom */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                style={{ position: "absolute", bottom: "2rem", left: 0, right: 0, textAlign: "center" }}>
                <div style={{ height: "1px", width: "40px", background: `linear-gradient(90deg,transparent,${gold},transparent)`, margin: "0 auto 0.5rem" }} />
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.35em", color: heroUrl ? "rgba(255,255,255,0.35)" : PEARL.muted, textTransform: "uppercase" }}>Scroll untuk melihat</p>
              </motion.div>
            </div>

            {/* Bottom ornament bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: opened ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          minHeight: "100dvh",
          background: bgImage ? undefined : ivory,
          backgroundImage: bgImage ? `url('${bgImage.url}')` : undefined,
          backgroundAttachment: bgImage ? "fixed" : undefined,
          backgroundSize: bgImage ? "cover" : undefined,
          backgroundPosition: bgImage ? "center" : undefined,
          position: "relative",
        }}
      >
        {bgImage && (
          <div style={{ position: "fixed", inset: 0, background: `${ivory}cc`, zIndex: 0, pointerEvents: "none" }} />
        )}

        <div style={{ position: "relative", zIndex: 1 }}>
          {coverGone && (
            <>
              {/* ── Hero strip ── */}
              <HeroStrip heroUrl={heroUrl} gold={gold} ivory={ivory} text={text} fontH={fontH} coupleLabel={coupleLabel} invLabel={invLabel} />

              {/* ── Countdown ── */}
              {showCountdown && countdownTimeLeft && (
                <section style={{ padding: "3rem 1.5rem", background: champagne, textAlign: "center" }}>
                  <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "0.7rem", letterSpacing: "0.28em", fontStyle: "italic", color: gold, marginBottom: "1.5rem" }}>
                    Menuju Hari Bahagia
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                    {[{ v: countdownTimeLeft.days, l: "Hari" }, { v: countdownTimeLeft.hours, l: "Jam" }, { v: countdownTimeLeft.minutes, l: "Menit" }, { v: countdownTimeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
                      <div key={l} style={{ textAlign: "center", minWidth: "3rem" }}>
                        <div style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "2.4rem", fontWeight: 300, color: gold, lineHeight: 1 }}>
                          {String(v).padStart(2, "0")}
                        </div>
                        <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: text, opacity: 0.4, marginTop: "0.3rem" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Couple ── */}
              {sectionKeys.includes("COUPLE") && profile && (
                <CoupleSection profile={profile} gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} fontB={fontB} />
              )}

              {/* ── Events ── */}
              {sectionKeys.includes("EVENT") && (
                <EventSection events={client.events} gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} fontB={fontB} />
              )}

              {/* ── Gallery ── */}
              {sectionKeys.includes("GALLERY") && (
                <GallerySection galleries={client.galleries} gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} />
              )}

              {/* ── RSVP ── */}
              {sectionKeys.includes("RSVP") && (
                token && guest
                  ? <RSVPSection clientId={client.id} guest={guest} token={token} gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} fontB={fontB} />
                  : <RSVPPlaceholder gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} />
              )}

              {guest?.barcodeChurch && (
                <BarcodeSection
                  barcodeChurch={guest.barcodeChurch}
                  barcodeReception={guest.barcodeReception ?? null}
                  invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
                  churchVenueName={client.events.find((e: any) => e.type === "PEMBERKATAN")?.venueName || client.events[0]?.venueName || "Gereja"}
                  receptionVenueName={client.events.find((e: any) => e.type === "RESEPSI")?.venueName || "Resepsi"}
                  primaryColor={gold}
                  bgColor={ivory}
                  fontHeading={fontH}
                />
              )}

              {/* ── Wishes ── */}
              {sectionKeys.includes("WISHES") && (
                <WishesSection
                  clientId={client.id} initialWishes={client.wishes}
                  guestName={guest?.name} guestId={guest?.id}
                  gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} fontB={fontB}
                />
              )}

              {/* ── Gift ── */}
              {sectionKeys.includes("GIFT") && (
                <GiftSection gifts={client.gifts} gold={gold} ivory={ivory} champagne={champagne} text={text} fontH={fontH} fontB={fontB} />
              )}

              {/* ── Footer ── */}
              <footer style={{ padding: "4rem 1.5rem", textAlign: "center", background: "#2a1f1a" }}>
                <div style={{ height: "1px", width: "60px", background: `linear-gradient(90deg,transparent,${gold},transparent)`, margin: "0 auto 1.5rem" }} />
                <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.6rem", fontWeight: 300, color: gold, marginBottom: "0.5rem" }}>
                  {coupleLabel}
                </p>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Forever & Always</p>
                <div style={{ height: "1px", width: "40px", background: `linear-gradient(90deg,transparent,${gold}66,transparent)`, margin: "1.5rem auto 0" }} />
                <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginTop: "1rem" }}>Made with love</p>
              </footer>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Hero Strip ───────────────────────────────────────────────────────────────

function HeroStrip({ heroUrl, gold, ivory, text, fontH, coupleLabel, invLabel }: {
  heroUrl?: string; gold: string; ivory: string; text: string; fontH: string; coupleLabel: string; invLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 80]);

  return (
    <div ref={ref} style={{ position: "relative", height: "220px", overflow: "hidden" }}>
      <motion.div style={{ y, position: "absolute", inset: "-20px" }}>
        {heroUrl ? (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${heroUrl}')`, backgroundSize: "cover", backgroundPosition: "center 30%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(253,248,243,0.1) 0%,rgba(253,248,243,0.6) 70%,rgba(253,248,243,1) 100%)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, #e8d8c8 0%, #f5ede0 100%)` }} />
        )}
      </motion.div>

      {/* Fade edges */}
      <div style={{ position: "absolute", inset: 0, left: 0, width: "15%", background: `linear-gradient(to right, ${ivory}, transparent)`, zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, right: 0, left: "auto", width: "15%", background: `linear-gradient(to left, ${ivory}, transparent)`, zIndex: 2 }} />

      {/* Glass title bubble */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
      }}>
        <div style={{
          background: "rgba(253,248,243,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(201,169,110,0.25)", borderRadius: "16px",
          padding: "20px 40px",
        }}>
          <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "0.75rem", letterSpacing: "0.25em", color: gold, marginBottom: "0.25rem", fontStyle: "italic" }}>
            {invLabel}
          </p>
          <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.9rem", fontWeight: 300, color: text, lineHeight: 1.2 }}>
            {coupleLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section title helper ─────────────────────────────────────────────────────

function SectionTitle({ eyebrow, title, gold, text, fontH }: { eyebrow: string; title: string; gold: string; text: string; fontH: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
      <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.5rem" }}>{eyebrow}</p>
      <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "2.2rem", fontWeight: 300, color: text, lineHeight: 1.2 }}>{title}</p>
      <div style={{ height: "1px", width: "48px", background: `linear-gradient(90deg,transparent,${gold},transparent)`, margin: "1rem auto 0" }} />
    </div>
  );
}

// ─── Couple Section ───────────────────────────────────────────────────────────

function CoupleSection({ profile, gold, ivory, champagne, text, fontH, fontB }: {
  profile: NonNullable<Profile>; gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string;
}) {
  return (
    <section style={{ padding: "5rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <FadeSection>
          <SectionTitle eyebrow="Mempelai" title="Pasangan Bahagia" gold={gold} text={text} fontH={fontH} />
        </FadeSection>

        {/* Groom */}
        <FadeSection delay={0.1}>
          <div style={{ marginBottom: "2rem" }}>
            {profile.showGroomPhoto && (
              <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ display: "inline-block", marginBottom: "1.25rem" }}>
                {profile.groomPhoto ? (
                  <div style={{
                    width: "160px", height: "160px", borderRadius: "50%", overflow: "hidden",
                    border: `3px solid ${gold}55`,
                    boxShadow: `0 8px 32px ${gold}28, 0 0 0 6px ${champagne}`,
                    margin: "0 auto",
                  }}>
                    <img src={profile.groomPhoto} alt={profile.groomName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ) : (
                  <div style={{
                    width: "160px", height: "160px", borderRadius: "50%",
                    background: champagne, border: `3px solid ${gold}44`,
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                  }}>
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.75rem", fontWeight: 400, color: text }}>{profile.groomName}</p>
            {profile.groomParents && <p style={{ fontSize: "0.8rem", color: text, opacity: 0.5, marginTop: "0.4rem", lineHeight: 1.5, fontFamily: `'${fontB}',Lato,sans-serif` }}>{profile.groomParents}</p>}
          </div>
        </FadeSection>

        <FadeSection delay={0.15}>
          <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "3rem", fontWeight: 300, color: gold, lineHeight: 1, margin: "0.5rem 0 1.5rem" }}>&amp;</p>
        </FadeSection>

        {/* Bride */}
        <FadeSection delay={0.2}>
          <div style={{ marginBottom: "2.5rem" }}>
            {profile.showBridePhoto && (
              <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ display: "inline-block", marginBottom: "1.25rem" }}>
                {profile.bridePhoto ? (
                  <div style={{
                    width: "160px", height: "160px", borderRadius: "50%", overflow: "hidden",
                    border: `3px solid ${gold}55`,
                    boxShadow: `0 8px 32px ${gold}28, 0 0 0 6px ${champagne}`,
                    margin: "0 auto",
                  }}>
                    <img src={profile.bridePhoto} alt={profile.brideName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ) : (
                  <div style={{
                    width: "160px", height: "160px", borderRadius: "50%",
                    background: champagne, border: `3px solid ${gold}44`,
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                  }}>
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.75rem", fontWeight: 400, color: text }}>{profile.brideName}</p>
            {profile.brideParents && <p style={{ fontSize: "0.8rem", color: text, opacity: 0.5, marginTop: "0.4rem", lineHeight: 1.5, fontFamily: `'${fontB}',Lato,sans-serif` }}>{profile.brideParents}</p>}
          </div>
        </FadeSection>

        {/* Opening quote */}
        {profile.openingQuote && (
          <FadeSection delay={0.25}>
            <div style={{ borderTop: `1px solid ${gold}28`, paddingTop: "2rem", marginTop: "1rem" }}>
              <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.1rem", fontStyle: "italic", fontWeight: 300, lineHeight: 1.7, color: text, opacity: 0.65 }}>
                &ldquo;{profile.openingQuote}&rdquo;
              </p>
              {profile.openingQuoteBy && (
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: gold, marginTop: "0.75rem" }}>— {profile.openingQuoteBy}</p>
              )}
            </div>
          </FadeSection>
        )}

        {/* Story */}
        {profile.story && (
          <FadeSection delay={0.3}>
            <div style={{ borderTop: `1px solid ${gold}22`, paddingTop: "2rem", marginTop: "2rem" }}>
              {profile.showStoryTitle && (
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "1rem" }}>
                  {profile.storyTitle?.trim() || "Cerita Singkat Pasangan"}
                </p>
              )}
              <div
                className="story-html"
                style={{ fontSize: "0.9rem", lineHeight: 1.85, color: text, opacity: 0.65, fontFamily: `'${fontB}',Lato,sans-serif` }}
                dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
              />
            </div>
          </FadeSection>
        )}
      </div>
    </section>
  );
}

// ─── Event Section ────────────────────────────────────────────────────────────

function EventSection({ events, gold, ivory, champagne, text, fontH, fontB }: {
  events: Props["client"]["events"]; gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string;
}) {
  if (!events.length) return null;
  return (
    <section style={{ padding: "5rem 1.5rem", background: champagne }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Jadwal" title="Detail Acara" gold={gold} text={text} fontH={fontH} />
        </FadeSection>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map((ev, i) => (
            <FadeSection key={ev.id} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -3, boxShadow: `0 16px 40px ${gold}18` }}
                transition={{ duration: 0.3 }}
                style={{
                  background: ivory, borderRadius: "20px", padding: "1.75rem",
                  border: `1px solid ${gold}22`,
                  boxShadow: `0 4px 20px ${gold}0e`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: "3px", height: "28px", background: `linear-gradient(to bottom, ${gold}, ${gold}44)`, borderRadius: "9999px" }} />
                  <h3 style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.4rem", fontWeight: 400, color: text }}>
                    {ev.label || EVENT_LABEL[ev.type] || ev.type}
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {ev.date && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Calendar size={13} color={gold} />
                      <p style={{ fontSize: "0.85rem", color: text, opacity: 0.7, fontFamily: `'${fontB}',Lato,sans-serif` }}>{formatDate(ev.date)}</p>
                    </div>
                  )}
                  {(ev.timeStart || ev.timeEnd) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Clock size={13} color={gold} />
                      <p style={{ fontSize: "0.85rem", color: text, opacity: 0.7, fontFamily: `'${fontB}',Lato,sans-serif` }}>
                        {ev.timeStart}{ev.timeEnd && ` – ${ev.timeEnd}`} WIB
                      </p>
                    </div>
                  )}
                  {ev.venueName && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <MapPin size={13} color={gold} style={{ marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: text, opacity: 0.85, fontFamily: `'${fontB}',Lato,sans-serif` }}>{ev.venueName}</p>
                        {ev.venueAddress && <p style={{ fontSize: "0.75rem", color: text, opacity: 0.45, marginTop: "0.2rem", fontFamily: `'${fontB}',Lato,sans-serif` }}>{ev.venueAddress}</p>}
                      </div>
                    </div>
                  )}
                </div>
                {ev.mapsUrl && (
                  <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                      marginTop: "1.25rem", padding: "0.6rem",
                      border: `1px solid ${gold}55`, borderRadius: "9999px",
                      fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase",
                      color: gold, textDecoration: "none", fontFamily: `'${fontB}',Lato,sans-serif`,
                    }}>
                    <MapPin size={11} /> Lihat Lokasi
                  </a>
                )}
              </motion.div>
            </FadeSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section — cinematic masonry + carousel ──────────────────────────

function GallerySection({ galleries, gold, ivory, champagne, text, fontH }: {
  galleries: Props["client"]["galleries"]; gold: string; ivory: string; champagne: string; text: string; fontH: string;
}) {
  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  if (!photos.length) return null;

  // Carousel swipe
  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setActiveIdx((i) => Math.min(i + 1, photos.length - 1));
    else setActiveIdx((i) => Math.max(i - 1, 0));
  }

  return (
    <section style={{ padding: "5rem 0", background: ivory, overflow: "hidden" }}>
      <div style={{ padding: "0 1.5rem", maxWidth: "480px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Momen" title="Galeri" gold={gold} text={text} fontH={fontH} />
        </FadeSection>
      </div>

      {/* Floating carousel */}
      <div style={{ position: "relative", overflow: "hidden", cursor: "grab" }}
        ref={carouselRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <motion.div
          style={{ display: "flex", gap: "12px", paddingLeft: "calc(50vw - 140px)", paddingRight: "calc(50vw - 140px)" }}
          animate={{ x: -activeIdx * (280 + 12) }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {photos.map((photo, i) => {
            const isActive = i === activeIdx;
            return (
              <motion.div
                key={photo.id}
                onClick={() => { if (isActive) setLightbox(photo.url); else setActiveIdx(i); }}
                animate={{
                  scale: isActive ? 1 : 0.82,
                  opacity: isActive ? 1 : 0.45,
                  filter: isActive ? "blur(0px)" : "blur(0.5px)",
                }}
                whileHover={isActive ? { scale: 1.02 } : {}}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flexShrink: 0, width: "280px", borderRadius: "20px", overflow: "hidden",
                  cursor: "pointer", pointerEvents: "auto",
                  boxShadow: isActive ? `0 24px 60px rgba(61,46,40,0.2), 0 4px 12px ${gold}22` : "none",
                  border: isActive ? `1px solid ${gold}33` : "none",
                }}
              >
                <div style={{ aspectRatio: "3/4" }}>
                  <img src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }} />
                </div>
                {isActive && (
                  <div style={{
                    position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(61,46,40,0.3) 0%, transparent 50%)",
                    borderRadius: "20px", pointerEvents: "none",
                  }} />
                )}
              </motion.div>
            );
          })}
        </motion.div>

      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(42,31,26,0.92)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
            }}
          >
            <motion.img
              src={lightbox} alt=""
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ maxWidth: "100%", maxHeight: "90dvh", objectFit: "contain", borderRadius: "16px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

function RSVPSection({ clientId, guest, token, gold, ivory, champagne, text, fontH, fontB }: {
  clientId: string; guest: Guest; token: string;
  gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">(guest.rsvp?.status as "HADIR" | "TIDAK_HADIR" || "HADIR");
  const [pax, setPax] = useState(guest.rsvp?.paxCount || 1);
  const [msg, setMsg] = useState(guest.rsvp?.message || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/rsvp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, guestId: guest.id, token, name: guest.name, paxCount: pax, status, message: msg }),
    });
    if (res.ok) setDone(true);
    setSaving(false);
  }

  return (
    <section style={{ padding: "5rem 1.5rem", background: champagne }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Konfirmasi" title="RSVP" gold={gold} text={text} fontH={fontH} />
        </FadeSection>
        <FadeSection delay={0.1}>
          {done ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: ivory, borderRadius: "24px", border: `1px solid ${gold}22` }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, delay: 0.2 }}
                style={{ width: "52px", height: "52px", borderRadius: "50%", background: `${gold}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Heart size={22} color={gold} />
              </motion.div>
              <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.3rem", color: text }}>Terima kasih!</p>
              <p style={{ fontSize: "0.85rem", color: text, opacity: 0.5, marginTop: "0.25rem", fontFamily: `'${fontB}',Lato,sans-serif` }}>Konfirmasi kehadiran telah diterima</p>
            </div>
          ) : (
            <div style={{ background: ivory, borderRadius: "24px", padding: "1.75rem", border: `1px solid ${gold}22`, boxShadow: `0 8px 32px ${gold}10` }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                  <motion.button key={s} onClick={() => setStatus(s)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: "0.7rem", borderRadius: "9999px",
                      border: `1px solid ${status === s ? gold : gold + "30"}`,
                      background: status === s ? `linear-gradient(135deg,${gold}22,${gold}10)` : "transparent",
                      color: status === s ? gold : `${text}60`,
                      fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                      cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`,
                    }}>
                    {s === "HADIR" ? "Hadir" : "Tidak Hadir"}
                  </motion.button>
                ))}
              </div>
              {status === "HADIR" && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: "0.6rem", fontFamily: `'${fontB}',Lato,sans-serif` }}>Jumlah Tamu</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPax(Math.max(1, pax - 1))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", border: `1px solid ${gold}40`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</motion.button>
                    <span style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.5rem", color: text, minWidth: "1.5rem", textAlign: "center" }}>{pax}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPax(Math.min(guest.maxPax, pax + 1))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", border: `1px solid ${gold}40`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</motion.button>
                    <span style={{ fontSize: "0.75rem", color: text, opacity: 0.4, fontFamily: `'${fontB}',Lato,sans-serif` }}>maks. {guest.maxPax}</span>
                  </div>
                </div>
              )}
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
                placeholder="Pesan atau doa (opsional)"
                style={{ width: "100%", background: champagne, border: `1px solid ${gold}22`, borderRadius: "12px", padding: "0.75rem", fontSize: "0.85rem", color: text, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: `'${fontB}',Lato,sans-serif` }} />
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${gold}44` }}
                whileTap={{ scale: 0.98 }}
                onClick={submit} disabled={saving}
                style={{
                  width: "100%", marginTop: "1rem", padding: "0.9rem",
                  background: `linear-gradient(135deg, ${gold}, #e8c98a, ${gold})`,
                  color: "#3d2e28", border: "none", borderRadius: "9999px",
                  fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`,
                  opacity: saving ? 0.6 : 1,
                }}>
                {saving ? "Mengirim..." : "Konfirmasi Kehadiran"}
              </motion.button>
            </div>
          )}
        </FadeSection>
      </div>
    </section>
  );
}

function RSVPPlaceholder({ gold, ivory, champagne, text, fontH }: { gold: string; ivory: string; champagne: string; text: string; fontH: string }) {
  return (
    <section style={{ padding: "5rem 1.5rem", background: champagne }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Konfirmasi" title="RSVP" gold={gold} text={text} fontH={fontH} />
        </FadeSection>
        <FadeSection delay={0.1}>
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: ivory, borderRadius: "24px", border: `1px solid ${gold}22` }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `${gold}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <LockKeyhole size={20} color={gold} />
            </div>
            <p style={{ fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontSize: "1.1rem", color: text }}>Konfirmasi Kehadiran</p>
            <p style={{ fontSize: "0.8rem", color: text, opacity: 0.45, marginTop: "0.4rem", lineHeight: 1.6 }}>RSVP tersedia melalui link undangan personal.</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", pointerEvents: "none" }}>
              {["Hadir", "Tidak Hadir"].map((s) => (
                <div key={s} style={{ flex: 1, padding: "0.65rem", borderRadius: "9999px", border: `1px solid ${gold}28`, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: `${gold}55`, textAlign: "center" }}>{s}</div>
              ))}
            </div>
          </div>
        </FadeSection>
      </div>
    </section>
  );
}

// ─── Wishes Section ───────────────────────────────────────────────────────────

function WishesSection({ clientId, initialWishes, guestName, guestId, gold, ivory, champagne, text, fontH, fontB }: {
  clientId: string; initialWishes: Props["client"]["wishes"];
  guestName?: string; guestId?: string;
  gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string;
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name: name || "Tamu", message: msg, guestId }),
    });
    if (res.ok) {
      const data = await res.json();
      setWishes((p) => [data, ...p]);
      setMsg(""); setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: champagne, border: `1px solid ${gold}22`, borderRadius: "12px",
    padding: "0.75rem", fontSize: "0.85rem", color: text, outline: "none", boxSizing: "border-box",
    fontFamily: `'${fontB}',Lato,sans-serif`,
  };

  return (
    <section style={{ padding: "5rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Pesan" title="Ucapan & Doa" gold={gold} text={text} fontH={fontH} />
        </FadeSection>

        {/* Form */}
        <FadeSection delay={0.1}>
          <div style={{ background: champagne, borderRadius: "20px", padding: "1.5rem", marginBottom: "1.5rem", border: `1px solid ${gold}20` }}>
            {!guestName && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda"
                style={{ ...inputStyle, marginBottom: "0.75rem", background: ivory }} />
            )}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              placeholder="Tulis doa dan ucapan..."
              style={{ ...inputStyle, resize: "none", marginBottom: "0.75rem", background: ivory }} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={send} disabled={sending || !msg.trim()}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.8rem", background: `linear-gradient(135deg, ${gold}, #e8c98a, ${gold})`,
                color: "#3d2e28", border: "none", borderRadius: "9999px",
                fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`,
                opacity: sending || !msg.trim() ? 0.5 : 1,
              }}>
              <Send size={13} /> {sent ? "Terkirim!" : sending ? "Mengirim..." : "Kirim Ucapan"}
            </motion.button>
          </div>
        </FadeSection>

        {/* Wishes list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
          {wishes.map((w, i) => (
            <FadeSection key={w.id} delay={i * 0.05}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
                style={{ background: champagne, borderRadius: "16px", padding: "1rem 1.25rem", border: `1px solid ${gold}18` }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: gold, marginBottom: "0.3rem", letterSpacing: "0.05em" }}>{w.name}</p>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.65, color: text, opacity: 0.7, fontFamily: `'${fontB}',Lato,sans-serif` }}>{w.message}</p>
                {w.reply && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: `1px solid ${gold}20`, paddingLeft: "0.75rem", borderLeft: `2px solid ${gold}55` }}>
                    <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: gold, marginBottom: "0.25rem" }}>Balasan</p>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: text, opacity: 0.6, fontStyle: "italic", fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif` }}>{w.reply}</p>
                  </div>
                )}
              </motion.div>
            </FadeSection>
          ))}
          {wishes.length === 0 && (
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: text, opacity: 0.4, padding: "2rem 0", fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontStyle: "italic" }}>
              Jadilah yang pertama memberikan ucapan...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Gift Section ─────────────────────────────────────────────────────────────

const BANK_THEMES: Record<string, { from: string; to: string }> = {
  BCA: { from: "#005bac", to: "#1a8fe0" }, BNI: { from: "#e65c00", to: "#f9a825" },
  MANDIRI: { from: "#003087", to: "#0057e0" }, BRI: { from: "#003087", to: "#1a5276" },
  CIMB: { from: "#b71c1c", to: "#e53935" },
};
function getBankTheme(name: string) {
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(BANK_THEMES)) if (u.includes(k)) return v;
  return { from: "#3d2e28", to: "#6b5248" };
}

function GiftSection({ gifts, gold, ivory, champagne, text, fontH, fontB }: {
  gifts: Props["client"]["gifts"]; gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string;
}) {
  const active = gifts.filter((g) => g.isActive);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  if (!active.length) return null;
  const banks = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(key); setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section style={{ padding: "5rem 1.5rem", background: champagne }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <FadeSection>
          <SectionTitle eyebrow="Hadiah" title="Amplop Digital" gold={gold} text={text} fontH={fontH} />
          <p style={{ textAlign: "center", fontSize: "0.85rem", lineHeight: 1.7, color: text, opacity: 0.5, marginTop: "0.5rem", fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontStyle: "italic" }}>
            Doa restu Anda adalah hadiah terbaik kami.
          </p>
        </FadeSection>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
          {banks.map((gift) => {
            const bt = getBankTheme(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <FadeSection key={gift.id}>
                <motion.div whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(61,46,40,0.2)" }} transition={{ duration: 0.3 }}
                  style={{ borderRadius: "20px", overflow: "hidden", position: "relative", aspectRatio: "1.586/1", minHeight: "190px", background: `linear-gradient(135deg,${bt.from},${bt.to})` }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.1),transparent 60%)" }} />
                  <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "1.1rem", letterSpacing: "0.05em" }}>{gift.bankName}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Transfer Bank</span>
                    </div>
                    <p style={{ fontFamily: "monospace", color: "#fff", fontSize: "1.1rem", letterSpacing: "0.2em" }}>
                      {(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Atas Nama</p>
                        <p style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500, textTransform: "uppercase" }}>{gift.accountName}</p>
                      </div>
                      <button onClick={() => copy(key, gift.accountNumber || "")}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", borderRadius: "6px", color: "#fff", fontSize: "0.7rem", cursor: "pointer" }}>
                        {copiedId === key ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </FadeSection>
            );
          })}

          {ewallets.map((gift) => {
            const key = `ew-${gift.id}`;
            return (
              <FadeSection key={gift.id}>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25 }}
                  style={{ background: ivory, borderRadius: "16px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", border: `1px solid ${gold}22` }}>
                  <div style={{ padding: "0.75rem", borderRadius: "12px", background: `${gold}18`, flexShrink: 0 }}>
                    <Wallet size={18} color={gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px", fontFamily: `'${fontB}',Lato,sans-serif` }}>E-Wallet</p>
                    <p style={{ fontWeight: 600, color: text }}>{gift.ewalletType}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.85rem", color: text, opacity: 0.6, marginTop: "2px" }}>{gift.ewalletNumber}</p>
                  </div>
                  <button onClick={() => copy(key, gift.ewalletNumber || "")} style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.4 }}>
                    {copiedId === key ? <Check size={15} color="green" /> : <Copy size={15} />}
                  </button>
                </motion.div>
              </FadeSection>
            );
          })}

          {qrisList.map((gift) => (
            <FadeSection key={gift.id}>
              <div style={{ background: ivory, borderRadius: "16px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", borderRadius: "12px", background: `${gold}18` }}><QrCode size={18} color={gold} /></div>
                    <div>
                      <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, letterSpacing: "0.1em", textTransform: "uppercase" }}>QRIS</p>
                      <p style={{ fontWeight: 600, color: text }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)}
                    style={{ padding: "0.5rem 1rem", border: `1px solid ${gold}55`, borderRadius: "9999px", background: "transparent", color: gold, fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer" }}>
                    {qrisOpen === gift.id ? "Tutup" : "Lihat QR"}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {qrisOpen === gift.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", borderTop: `1px solid ${gold}18`, padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img src={gift.qrisImage!} alt="QRIS" style={{ maxWidth: "180px", width: "100%", borderRadius: "12px" }} />
                      <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, marginTop: "0.5rem" }}>Scan untuk transfer</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeSection>
          ))}
        </div>

        <FadeSection>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Gift size={18} color={gold} style={{ opacity: 0.4, margin: "0 auto 0.5rem" }} />
            <p style={{ fontSize: "0.75rem", color: text, opacity: 0.35, fontFamily: `'${fontH}',Cormorant Garamond,Georgia,serif`, fontStyle: "italic" }}>Terima kasih atas kasih sayang Anda</p>
          </div>
        </FadeSection>
      </div>
    </section>
  );
}
