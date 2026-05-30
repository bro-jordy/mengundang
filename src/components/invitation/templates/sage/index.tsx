"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Calendar, Copy, Check, Wallet, QrCode, Gift, Send, Heart, LockKeyhole, X } from "lucide-react";
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

// ─── Sage palette defaults ────────────────────────────────────────────────────
const SAGE = {
  accent: "#7c9a7e",   // sage green
  cream: "#fafaf8",
  ivory: "#f2efe9",
  text: "#1e1e1c",
  muted: "#8a8880",
  sand: "#e8e2d9",
};

// ─── Fade-in on scroll — whileInView once:true, stays visible permanently ────

function Reveal({ children, delay = 0, y = 24, className }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export function SageTemplate({ guest, client, token }: Props) {
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
  const accent = th?.primaryColor || SAGE.accent;
  const cream = th?.bgColor || SAGE.cream;
  const ivory = th?.secondaryColor || SAGE.ivory;
  const text = th?.textColor || SAGE.text;
  const fontH = th?.fontHeading || "Playfair Display";
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,300&display=swap');
        body { background-color:${cream}; color:${text}; margin:0; -webkit-font-smoothing:antialiased; font-family:'${fontB}',Lato,sans-serif; }
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:${accent}44;border-radius:9999px;}
        .sage-snap-x { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .sage-snap-item { scroll-snap-align: center; }
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
            transition={{ duration: 0.9, ease: "easeInOut" }}
            onAnimationComplete={() => { if (opened) setCoverGone(true); }}
            style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: opened ? "none" : "auto" }}
          >
            {/* BG */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: heroUrl ? `url('${heroUrl}')` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              backgroundColor: heroUrl ? undefined : ivory,
            }} />
            {heroUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(30,30,28,0.42)" }} />}

            {/* Top rule */}
            <div style={{ position: "absolute", top: "1.5rem", left: "2rem", right: "2rem", height: "1px", background: heroUrl ? "rgba(255,255,255,0.3)" : SAGE.sand }} />

            <div style={{ position: "relative", zIndex: 10, height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 2rem" }}>
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.25em" }}
                transition={{ delay: 0.4, duration: 1 }}
                style={{ fontFamily: `'${fontB}',Lato,sans-serif`, fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.7)" : accent, marginBottom: "1.25rem" }}
              >
                {invLabel}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "clamp(2.4rem,8vw,3.5rem)", fontWeight: 400, lineHeight: 1.15, color: heroUrl ? "#fff" : text, marginBottom: "0" }}
              >
                {profile?.groomNickname || "Groom"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
                style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.5rem", fontStyle: "italic", color: heroUrl ? "rgba(255,255,255,0.7)" : accent, margin: "0.25rem 0" }}
              >
                &amp;
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "clamp(2.4rem,8vw,3.5rem)", fontWeight: 400, lineHeight: 1.15, color: heroUrl ? "#fff" : text, marginBottom: "2rem" }}
              >
                {profile?.brideNickname || "Bride"}
              </motion.h1>

              {guest && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                  style={{ marginBottom: "2rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.55)" : SAGE.muted, marginBottom: "0.25rem" }}>Kepada Yth.</p>
                  <p style={{ fontWeight: 600, color: heroUrl ? "#fff" : text, fontSize: "1rem" }}>{guest.name}</p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.7 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpen}
                style={{
                  background: accent, color: "#fff",
                  border: "none", borderRadius: "4px",
                  padding: "12px 40px",
                  fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`,
                  boxShadow: `0 4px 20px ${accent}44`,
                }}
              >
                Buka Undangan
              </motion.button>
            </div>

            {/* Bottom rule */}
            <div style={{ position: "absolute", bottom: "1.5rem", left: "2rem", right: "2rem", height: "1px", background: heroUrl ? "rgba(255,255,255,0.3)" : SAGE.sand }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: opened ? 1 : 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{ background: bgImage ? undefined : cream, position: "relative" }}
      >
        {bgImage && (
          <>
            <div style={{ position: "fixed", inset: 0, backgroundImage: `url('${bgImage.url}')`, backgroundSize: "cover", backgroundPosition: "center", zIndex: -2 }} />
            <div style={{ position: "fixed", inset: 0, background: `${cream}e0`, zIndex: -1 }} />
          </>
        )}

        {coverGone && (
          <>
            {/* ── Hero strip ── */}
            {heroUrl && (
              <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${heroUrl}')`, backgroundSize: "cover", backgroundPosition: "center 25%" }} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(30,30,28,0.1) 0%, ${cream} 100%)` }} />
                <div style={{ position: "absolute", bottom: "1rem", left: 0, right: 0, textAlign: "center" }}>
                  <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.2rem", fontWeight: 400, color: text }}>{coupleLabel}</p>
                </div>
              </div>
            )}
            {!heroUrl && (
              <div style={{ padding: "2rem 1.5rem 1.5rem", textAlign: "center", borderBottom: `1px solid ${SAGE.sand}` }}>
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "0.35rem" }}>{invLabel}</p>
                <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.6rem", fontWeight: 400, color: text }}>{coupleLabel}</p>
              </div>
            )}

            {/* ── Countdown ── */}
            {showCountdown && countdownTimeLeft && (
              <section style={{ padding: "3rem 1.5rem", background: cream, textAlign: "center", borderTop: `1px solid ${accent}18` }}>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: accent, opacity: 0.8, marginBottom: "1.5rem" }}>
                  Menuju Hari Bahagia
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                  {[{ v: countdownTimeLeft.days, l: "Hari" }, { v: countdownTimeLeft.hours, l: "Jam" }, { v: countdownTimeLeft.minutes, l: "Menit" }, { v: countdownTimeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
                    <div key={l} style={{ textAlign: "center", minWidth: "3rem" }}>
                      <div style={{ fontFamily: `'${fontH}', Georgia, serif`, fontSize: "2.4rem", fontWeight: 400, color: accent, lineHeight: 1 }}>
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
              <CoupleSection profile={profile} accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} fontB={fontB} />
            )}

            {/* ── Events ── */}
            {sectionKeys.includes("EVENT") && (
              <EventSection events={client.events} accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} fontB={fontB} />
            )}

            {/* ── Gallery ── */}
            {sectionKeys.includes("GALLERY") && (
              <GallerySection galleries={client.galleries} accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} />
            )}

            {/* ── RSVP ── */}
            {sectionKeys.includes("RSVP") && (
              token && guest
                ? <RSVPSection clientId={client.id} guest={guest} token={token} accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} fontB={fontB} />
                : <RSVPPlaceholder accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} />
            )}

            {guest?.barcodeChurch && (
              <BarcodeSection
                barcodeChurch={guest.barcodeChurch}
                barcodeReception={guest.barcodeReception ?? null}
                invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
                churchVenueName={client.events.find((e: any) => e.type === "PEMBERKATAN")?.venueName || client.events[0]?.venueName || "Gereja"}
                receptionVenueName={client.events.find((e: any) => e.type === "RESEPSI")?.venueName || "Resepsi"}
                primaryColor={accent}
                bgColor={cream}
                fontHeading={fontH}
              />
            )}

            {/* ── Wishes ── */}
            {sectionKeys.includes("WISHES") && (
              <WishesSection
                clientId={client.id} initialWishes={client.wishes}
                guestName={guest?.name} guestId={guest?.id}
                accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} fontB={fontB}
              />
            )}

            {/* ── Gift ── */}
            {sectionKeys.includes("GIFT") && (
              <GiftSection gifts={client.gifts} accent={accent} cream={cream} ivory={ivory} text={text} fontH={fontH} fontB={fontB} />
            )}

            {/* ── Footer ── */}
            <footer style={{ padding: "4rem 2rem", textAlign: "center", borderTop: `1px solid ${SAGE.sand}`, background: cream }}>
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.5rem", fontStyle: "italic", color: accent, marginBottom: "0.5rem" }}>{coupleLabel}</p>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: SAGE.muted }}>Terima kasih atas doa dan kehadirannya</p>
              <div style={{ height: "1px", width: "40px", background: SAGE.sand, margin: "1.5rem auto" }} />
              <p style={{ fontSize: "0.6rem", color: SAGE.muted, opacity: 0.5 }}>Made with love</p>
            </footer>
          </>
        )}
      </motion.div>
    </>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ eyebrow, title, accent, text, fontH, fontB }: { eyebrow: string; title: string; accent: string; text: string; fontH: string; fontB: string }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <p style={{ fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: accent, marginBottom: "0.4rem", fontFamily: `'${fontB}',Lato,sans-serif` }}>{eyebrow}</p>
      <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "2rem", fontWeight: 400, color: text, lineHeight: 1.2 }}>{title}</p>
      <div style={{ height: "2px", width: "32px", background: accent, marginTop: "0.75rem", borderRadius: "1px" }} />
    </div>
  );
}

// ─── Couple Section ───────────────────────────────────────────────────────────

function CoupleSection({ profile, accent, cream, ivory, text, fontH, fontB }: {
  profile: NonNullable<Profile>; accent: string; cream: string; ivory: string; text: string; fontH: string; fontB: string;
}) {
  return (
    <section style={{ padding: "4rem 1.5rem", background: cream }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <SectionLabel eyebrow="Mempelai" title="Pasangan Bahagia" accent={accent} text={text} fontH={fontH} fontB={fontB} />
        </Reveal>

        {/* Side-by-side couple */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
          {/* Groom */}
          <Reveal delay={0.1}>
            <div style={{ textAlign: "center" }}>
              {profile.showGroomPhoto && (
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35 }}
                  style={{ marginBottom: "1rem", overflow: "hidden", borderRadius: "8px", aspectRatio: "3/4" }}>
                  {profile.groomPhoto ? (
                    <img src={profile.groomPhoto} alt={profile.groomName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: ivory, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "2.5rem" }}>👤</span>
                    </div>
                  )}
                </motion.div>
              )}
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.25rem", fontWeight: 500, color: text }}>{profile.groomNickname || profile.groomName}</p>
              <p style={{ fontSize: "0.75rem", color: text, opacity: 0.5, marginTop: "0.25rem" }}>{profile.groomName}</p>
              {profile.groomParents && <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, marginTop: "0.5rem", lineHeight: 1.5 }}>{profile.groomParents}</p>}
            </div>
          </Reveal>

          {/* Bride */}
          <Reveal delay={0.2}>
            <div style={{ textAlign: "center" }}>
              {profile.showBridePhoto && (
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35 }}
                  style={{ marginBottom: "1rem", overflow: "hidden", borderRadius: "8px", aspectRatio: "3/4" }}>
                  {profile.bridePhoto ? (
                    <img src={profile.bridePhoto} alt={profile.brideName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: ivory, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "2.5rem" }}>👤</span>
                    </div>
                  )}
                </motion.div>
              )}
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.25rem", fontWeight: 500, color: text }}>{profile.brideNickname || profile.brideName}</p>
              <p style={{ fontSize: "0.75rem", color: text, opacity: 0.5, marginTop: "0.25rem" }}>{profile.brideName}</p>
              {profile.brideParents && <p style={{ fontSize: "0.7rem", color: text, opacity: 0.4, marginTop: "0.5rem", lineHeight: 1.5 }}>{profile.brideParents}</p>}
            </div>
          </Reveal>
        </div>

        {/* Opening quote */}
        {profile.openingQuote && (
          <Reveal delay={0.3}>
            <div style={{ marginTop: "2.5rem", padding: "1.5rem", background: ivory, borderRadius: "8px", borderLeft: `3px solid ${accent}` }}>
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1rem", fontStyle: "italic", lineHeight: 1.7, color: text, opacity: 0.75 }}>
                &ldquo;{profile.openingQuote}&rdquo;
              </p>
              {profile.openingQuoteBy && (
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: accent, marginTop: "0.6rem" }}>— {profile.openingQuoteBy}</p>
              )}
            </div>
          </Reveal>
        )}

        {/* Story */}
        {profile.story && (
          <Reveal delay={0.35}>
            <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: `1px solid ${SAGE.sand}` }}>
              {profile.showStoryTitle && (
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "0.75rem" }}>
                  {profile.storyTitle?.trim() || "Cerita Singkat Pasangan"}
                </p>
              )}
              <div
                className="story-html"
                style={{ fontSize: "0.9rem", lineHeight: 1.85, color: text, opacity: 0.65 }}
                dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
              />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Event Section ────────────────────────────────────────────────────────────

function EventSection({ events, accent, cream, ivory, text, fontH, fontB }: {
  events: Props["client"]["events"]; accent: string; cream: string; ivory: string; text: string; fontH: string; fontB: string;
}) {
  if (!events.length) return null;
  return (
    <section style={{ padding: "4rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <SectionLabel eyebrow="Jadwal" title="Detail Acara" accent={accent} text={text} fontH={fontH} fontB={fontB} />
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: SAGE.sand, borderRadius: "8px", overflow: "hidden" }}>
          {events.map((ev, i) => (
            <Reveal key={ev.id} delay={i * 0.08}>
              <div style={{ background: cream, padding: "1.5rem" }}>
                <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.2rem", fontWeight: 500, color: text, marginBottom: "0.75rem" }}>
                  {ev.label || EVENT_LABEL[ev.type] || ev.type}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {ev.date && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Calendar size={13} color={accent} />
                      <p style={{ fontSize: "0.82rem", color: text, opacity: 0.65 }}>{formatDate(ev.date)}</p>
                    </div>
                  )}
                  {(ev.timeStart || ev.timeEnd) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={13} color={accent} />
                      <p style={{ fontSize: "0.82rem", color: text, opacity: 0.65 }}>{ev.timeStart}{ev.timeEnd && ` – ${ev.timeEnd}`} WIB</p>
                    </div>
                  )}
                  {ev.venueName && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <MapPin size={13} color={accent} style={{ marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: text }}>{ev.venueName}</p>
                        {ev.venueAddress && <p style={{ fontSize: "0.72rem", color: text, opacity: 0.45, marginTop: "2px" }}>{ev.venueAddress}</p>}
                      </div>
                    </div>
                  )}
                </div>
                {ev.mapsUrl && (
                  <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "0.75rem", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: accent, textDecoration: "none", fontWeight: 600 }}>
                    <MapPin size={10} /> Lihat Lokasi →
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section ──────────────────────────────────────────────────────────
// Two sections: Pinterest masonry grid (stagger) + horizontal scroll snap

function GallerySection({ galleries, accent, cream, ivory, text, fontH }: {
  galleries: Props["client"]["galleries"]; accent: string; cream: string; ivory: string; text: string; fontH: string;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");
  if (!photos.length) return null;

  // Split into two columns for masonry
  const col1 = photos.filter((_, i) => i % 2 === 0);
  const col2 = photos.filter((_, i) => i % 2 === 1);

  return (
    <section style={{ background: cream }}>

      {/* ── Part 1: Pinterest masonry grid ── */}
      <div style={{ padding: "4rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: accent, marginBottom: "0.4rem" }}>Galeri</p>
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "2rem", fontWeight: 400, color: text }}>Momen Berharga</p>
              <div style={{ height: "2px", width: "32px", background: accent, marginTop: "0.75rem", borderRadius: "1px" }} />
            </div>
          </Reveal>

          {/* Masonry 2-column grid with stagger */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {/* Column 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {col1.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                  onClick={() => setLightbox(photo.url)}
                  whileHover={{ scale: 1.02, zIndex: 2 }}
                  style={{
                    borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                    aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5",
                    position: "relative",
                  }}
                >
                  <img src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{ position: "absolute", inset: 0, background: `${accent}22`, borderRadius: "8px" }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Column 2 — offset by half a card for Pinterest feel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "40px" }}>
              {col2.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 + 0.04 }}
                  onClick={() => setLightbox(photo.url)}
                  whileHover={{ scale: 1.02, zIndex: 2 }}
                  style={{
                    borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                    aspectRatio: i % 3 === 0 ? "1/1" : i % 3 === 1 ? "3/4" : "4/5",
                    position: "relative",
                  }}
                >
                  <img src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{ position: "absolute", inset: 0, background: `${accent}22`, borderRadius: "8px" }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Part 2: Horizontal scroll snap cinematic strip ── */}
      {photos.length > 1 && (
        <div style={{ padding: "0 0 4rem" }}>
          <Reveal>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, padding: "0 1.5rem", marginBottom: "1rem" }}>Swipe untuk lihat lebih →</p>
          </Reveal>
          <div
            className="sage-snap-x"
            style={{ display: "flex", overflowX: "auto", gap: "12px", paddingLeft: "1.5rem", paddingRight: "1.5rem", scrollbarWidth: "none" }}
          >
            {photos.map((photo, i) => (
              <motion.div
                key={`snap-${photo.id}`}
                className="sage-snap-item"
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                onClick={() => setLightbox(photo.url)}
                whileHover={{ scale: 1.01 }}
                style={{
                  flexShrink: 0, width: "220px", borderRadius: "10px", overflow: "hidden",
                  cursor: "pointer", boxShadow: "0 8px 24px rgba(30,30,28,0.12)",
                }}
              >
                <div style={{ aspectRatio: "2/3" }}>
                  <img src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(30,30,28,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
          >
            <motion.img
              src={lightbox} alt=""
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ maxWidth: "100%", maxHeight: "90dvh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}
            />
            <button onClick={() => setLightbox(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="#fff" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

function RSVPSection({ clientId, guest, token, accent, cream, ivory, text, fontH, fontB }: {
  clientId: string; guest: Guest; token: string;
  accent: string; cream: string; ivory: string; text: string; fontH: string; fontB: string;
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

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: cream, border: `1px solid ${SAGE.sand}`, borderRadius: "4px",
    padding: "0.7rem 0.85rem", fontSize: "0.85rem", color: text, outline: "none", boxSizing: "border-box",
    fontFamily: `'${fontB}',Lato,sans-serif`,
  };

  return (
    <section style={{ padding: "4rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <SectionLabel eyebrow="Konfirmasi" title="RSVP" accent={accent} text={text} fontH={fontH} fontB={fontB} />
        </Reveal>
        <Reveal delay={0.1}>
          {done ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: cream, borderRadius: "8px", border: `1px solid ${SAGE.sand}` }}>
              <Heart size={24} color={accent} style={{ margin: "0 auto 1rem" }} />
              <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.2rem", color: text }}>Terima kasih!</p>
              <p style={{ fontSize: "0.82rem", color: text, opacity: 0.5, marginTop: "0.25rem" }}>Konfirmasi kehadiran telah diterima</p>
            </div>
          ) : (
            <div style={{ background: cream, borderRadius: "8px", border: `1px solid ${SAGE.sand}`, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{
                      flex: 1, padding: "0.65rem", borderRadius: "4px", border: `1px solid ${status === s ? accent : SAGE.sand}`,
                      background: status === s ? accent : "transparent",
                      color: status === s ? "#fff" : text, opacity: status === s ? 1 : 0.5,
                      fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                      cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`, transition: "all 0.2s",
                    }}>
                    {s === "HADIR" ? "Hadir" : "Tidak Hadir"}
                  </button>
                ))}
              </div>
              {status === "HADIR" && (
                <div>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: "0.5rem" }}>Jumlah Tamu</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button onClick={() => setPax(Math.max(1, pax - 1))}
                      style={{ width: "32px", height: "32px", borderRadius: "4px", border: `1px solid ${SAGE.sand}`, background: "transparent", color: text, cursor: "pointer", fontSize: "1.1rem" }}>−</button>
                    <span style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.3rem", color: text, minWidth: "1.5rem", textAlign: "center" }}>{pax}</span>
                    <button onClick={() => setPax(Math.min(guest.maxPax, pax + 1))}
                      style={{ width: "32px", height: "32px", borderRadius: "4px", border: `1px solid ${SAGE.sand}`, background: "transparent", color: text, cursor: "pointer", fontSize: "1.1rem" }}>+</button>
                    <span style={{ fontSize: "0.72rem", color: text, opacity: 0.4 }}>maks. {guest.maxPax}</span>
                  </div>
                </div>
              )}
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
                placeholder="Pesan atau doa (opsional)"
                style={{ ...fieldStyle, resize: "none" }} />
              <button onClick={submit} disabled={saving}
                style={{
                  background: accent, color: "#fff", border: "none", borderRadius: "4px",
                  padding: "0.8rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`, opacity: saving ? 0.6 : 1,
                }}>
                {saving ? "Mengirim..." : "Konfirmasi Kehadiran"}
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function RSVPPlaceholder({ accent, cream, ivory, text, fontH }: { accent: string; cream: string; ivory: string; text: string; fontH: string }) {
  return (
    <section style={{ padding: "4rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ background: cream, borderRadius: "8px", border: `1px solid ${SAGE.sand}`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
            <LockKeyhole size={20} color={accent} style={{ margin: "0 auto 1rem", opacity: 0.6 }} />
            <p style={{ fontFamily: `'${fontH}',Playfair Display,Georgia,serif`, fontSize: "1.1rem", color: text }}>Konfirmasi Kehadiran</p>
            <p style={{ fontSize: "0.8rem", color: text, opacity: 0.45, marginTop: "0.4rem", lineHeight: 1.6 }}>RSVP tersedia melalui link undangan personal.</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", pointerEvents: "none" }}>
              {["Hadir", "Tidak Hadir"].map((s) => (
                <div key={s} style={{ flex: 1, padding: "0.65rem", borderRadius: "6px", border: `1px solid ${accent}28`, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: `${accent}55`, textAlign: "center" }}>{s}</div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Wishes Section ───────────────────────────────────────────────────────────

function WishesSection({ clientId, initialWishes, guestName, guestId, accent, cream, ivory, text, fontH, fontB }: {
  clientId: string; initialWishes: Props["client"]["wishes"];
  guestName?: string; guestId?: string;
  accent: string; cream: string; ivory: string; text: string; fontH: string; fontB: string;
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

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: cream, border: `1px solid ${SAGE.sand}`, borderRadius: "4px",
    padding: "0.7rem 0.85rem", fontSize: "0.85rem", color: text, outline: "none", boxSizing: "border-box",
    fontFamily: `'${fontB}',Lato,sans-serif`,
  };

  return (
    <section style={{ padding: "4rem 1.5rem", background: cream }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <SectionLabel eyebrow="Pesan" title="Ucapan & Doa" accent={accent} text={text} fontH={fontH} fontB={fontB} />
        </Reveal>

        {/* Form */}
        <Reveal delay={0.1}>
          <div style={{ background: ivory, borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {!guestName && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" style={fieldStyle} />
            )}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              placeholder="Tulis doa dan ucapan..." style={{ ...fieldStyle, resize: "none" }} />
            <button onClick={send} disabled={sending || !msg.trim()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                background: accent, color: "#fff", border: "none", borderRadius: "4px",
                padding: "0.75rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: `'${fontB}',Lato,sans-serif`, opacity: sending || !msg.trim() ? 0.5 : 1,
              }}>
              <Send size={12} /> {sent ? "Terkirim!" : sending ? "Mengirim..." : "Kirim Ucapan"}
            </button>
          </div>
        </Reveal>

        {/* Wishes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: SAGE.sand, borderRadius: "8px", overflow: "hidden", maxHeight: "400px", overflowY: "auto" }}>
          {wishes.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              style={{ background: cream, padding: "1rem 1.25rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: text }}>{w.name}</p>
                <p style={{ fontSize: "0.65rem", color: text, opacity: 0.35 }}>{formatDate(w.createdAt)}</p>
              </div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: text, opacity: 0.65 }}>{w.message}</p>
              {w.reply && (
                <div style={{ marginTop: "0.75rem", paddingLeft: "0.75rem", borderLeft: `2px solid ${accent}66` }}>
                  <p style={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: "0.2rem" }}>Balasan</p>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: text, opacity: 0.6, fontStyle: "italic" }}>{w.reply}</p>
                </div>
              )}
            </motion.div>
          ))}
          {wishes.length === 0 && (
            <div style={{ background: cream, padding: "2rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: text, opacity: 0.35, fontStyle: "italic" }}>Jadilah yang pertama memberikan ucapan</p>
            </div>
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
  return { from: "#2c2c2a", to: "#4a4a48" };
}

function GiftSection({ gifts, accent, cream, ivory, text, fontH, fontB }: {
  gifts: Props["client"]["gifts"]; accent: string; cream: string; ivory: string; text: string; fontH: string; fontB: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  const active = gifts.filter((g) => g.isActive);
  if (!active.length) return null;

  const banks = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, val: string) {
    await navigator.clipboard.writeText(val);
    setCopiedId(key); setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section style={{ padding: "4rem 1.5rem", background: ivory }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Reveal>
          <SectionLabel eyebrow="Hadiah" title="Amplop Digital" accent={accent} text={text} fontH={fontH} fontB={fontB} />
          <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: text, opacity: 0.5, marginTop: "-1rem", marginBottom: "1.5rem", fontStyle: "italic" }}>
            Doa restu Anda adalah hadiah terbaik kami.
          </p>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {banks.map((gift) => {
            const bt = getBankTheme(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <Reveal key={gift.id}>
                <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "1.586/1", minHeight: "180px", background: `linear-gradient(135deg,${bt.from},${bt.to})`, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.08),transparent 60%)" }} />
                  <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", letterSpacing: "0.05em" }}>{gift.bankName}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Transfer Bank</span>
                    </div>
                    <p style={{ fontFamily: "monospace", color: "#fff", fontSize: "1rem", letterSpacing: "0.2em" }}>
                      {(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Atas Nama</p>
                        <p style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 500, textTransform: "uppercase" }}>{gift.accountName}</p>
                      </div>
                      <button onClick={() => copy(key, gift.accountNumber || "")}
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.65rem", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", fontSize: "0.68rem", cursor: "pointer" }}>
                        {copiedId === key ? <><Check size={10} /> Tersalin</> : <><Copy size={10} /> Salin</>}
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}

          {ewallets.map((gift) => {
            const key = `ew-${gift.id}`;
            return (
              <Reveal key={gift.id}>
                <div style={{ background: cream, borderRadius: "8px", padding: "1.1rem", display: "flex", alignItems: "center", gap: "0.875rem", border: `1px solid ${SAGE.sand}` }}>
                  <div style={{ padding: "0.6rem", borderRadius: "6px", background: `${accent}15`, flexShrink: 0 }}>
                    <Wallet size={16} color={accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: text, opacity: 0.4 }}>E-Wallet</p>
                    <p style={{ fontWeight: 600, color: text, fontSize: "0.9rem" }}>{gift.ewalletType}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.82rem", color: text, opacity: 0.55, marginTop: "1px" }}>{gift.ewalletNumber}</p>
                  </div>
                  <button onClick={() => copy(key, gift.ewalletNumber || "")} style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.4 }}>
                    {copiedId === key ? <Check size={14} color="green" /> : <Copy size={14} />}
                  </button>
                </div>
              </Reveal>
            );
          })}

          {qrisList.map((gift) => (
            <Reveal key={gift.id}>
              <div style={{ background: cream, borderRadius: "8px", overflow: "hidden", border: `1px solid ${SAGE.sand}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ padding: "0.6rem", borderRadius: "6px", background: `${accent}15` }}><QrCode size={16} color={accent} /></div>
                    <div>
                      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: text, opacity: 0.4 }}>QRIS</p>
                      <p style={{ fontWeight: 600, color: text, fontSize: "0.9rem" }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                    </div>
                  </div>
                  <button onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)}
                    style={{ padding: "0.4rem 0.875rem", border: `1px solid ${accent}`, borderRadius: "4px", background: "transparent", color: accent, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" }}>
                    {qrisOpen === gift.id ? "Tutup" : "Lihat QR"}
                  </button>
                </div>
                <AnimatePresence>
                  {qrisOpen === gift.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", borderTop: `1px solid ${SAGE.sand}`, padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img src={gift.qrisImage!} alt="QRIS" style={{ maxWidth: "160px", width: "100%", borderRadius: "8px" }} />
                      <p style={{ fontSize: "0.68rem", color: text, opacity: 0.4, marginTop: "0.5rem" }}>Scan untuk transfer</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Gift size={16} color={accent} style={{ opacity: 0.35, margin: "0 auto 0.4rem" }} />
            <p style={{ fontSize: "0.72rem", color: text, opacity: 0.35, fontStyle: "italic" }}>Terima kasih atas kasih sayang Anda</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
