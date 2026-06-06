"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JackpotCover } from "./JackpotCover";
import { JackpotCoupleSection } from "./JackpotCoupleSection";
import { JackpotEventSection } from "./JackpotEventSection";
import { GallerySection } from "../classic/GallerySection";
import { WishesSection } from "../classic/WishesSection";
import { GiftSection } from "../classic/GiftSection";
import { FloatingOrnaments, RevealSection, StaggerItem, StaggerWrap } from "./JackpotAnimations";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventLabel } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { Heart, LockKeyhole } from "lucide-react";
import type { Rsvp } from "@/types/prisma.types";
import { formatDate } from "@/lib/utils";

// ─── Translations ─────────────────────────────────────────────────────────────

const LANGS = {
  EN: {
    dearGuest: "Dear",
    invitedLabel: "We joyfully invite you",
    scrollHint: "scroll",
    countdownLabel: "Counting Down to Our Day",
    days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs",
    rsvpEyebrow: "Confirmation",
    rsvpTitle: "RSVP",
    attending: "Attending",
    notAttending: "Not Attending",
    guestCount: "Number of Guests",
    max: "max.",
    msgPlaceholder: "Message or prayer (optional)",
    confirmBtn: "Confirm Attendance",
    sending: "Sending...",
    thankYou: "Thank you!",
    confirmed: "Your attendance has been confirmed",
    rsvpLocked: "RSVP is available via your personal invitation link.",
    // closingText: "Thank you for your prayers and presence",
    closingText: "Made with ❤️",
    // madeWith: "Made with Mengundang",
    madeWith: " ",
  },
  ID: {
    dearGuest: "Kepada Yth.",
    invitedLabel: "Dengan penuh sukacita kami mengundang",
    scrollHint: "geser",
    countdownLabel: "Menuju Hari Bahagia",
    days: "Hari", hours: "Jam", minutes: "Menit", seconds: "Detik",
    rsvpEyebrow: "Konfirmasi",
    rsvpTitle: "RSVP",
    attending: "Hadir",
    notAttending: "Tidak Hadir",
    guestCount: "Jumlah Tamu",
    max: "maks.",
    msgPlaceholder: "Pesan atau doa (opsional)",
    confirmBtn: "Konfirmasi Kehadiran",
    sending: "Mengirim...",
    thankYou: "Terima kasih!",
    confirmed: "Konfirmasi kehadiran telah diterima",
    rsvpLocked: "RSVP tersedia melalui link undangan personal.",
    // closingText: "Terima kasih atas doa dan kehadirannya",
    closingText: "Dibuat dengan ❤️",
    // madeWith: "Made with Mengundang",
    madeWith: " ",
  },
} as const;
type Lang = keyof typeof LANGS;

// ─── Countdown hook ───────────────────────────────────────────────────────────

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
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: "GEREJA_SAJA" | "GEREJA_RESEPSI";
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

interface Props {
  guest: Guest | null;
  client: {
    id: string;
    name: string;
    slug: string;
    clientType: string;
    weddingProfile: {
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
    galleries: {
      id: string;
      url: string;
      type: "HERO" | "COVER" | "BACKGROUND" | "PREWEDDING" | "GALLERY";
      sortOrder: number;
    }[];
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

const INVITATION_LABEL = {
  EN: { WEDDING: "The Wedding Of", SANGJIT: "Sangjit Ceremony Of", LAMARAN: "Engagement Of" },
  ID: { WEDDING: "Pernikahan", SANGJIT: "Sangjit", LAMARAN: "Lamaran" },
} as const;

// ─── RSVP ─────────────────────────────────────────────────────────────────────

function JackpotRSVP({
  clientId, guest, token, primaryColor, bgColor, secondaryColor, textColor, fontHeading, t, onConfirmed,
}: {
  clientId: string; guest: NonNullable<Props["guest"]>; token: string;
  primaryColor: string; bgColor: string; secondaryColor: string; textColor: string; fontHeading: string;
  t: typeof LANGS[Lang];
  onConfirmed?: (s: "HADIR" | "TIDAK_HADIR") => void;
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, guestId: guest.id, token, name: guest.name, paxCount: pax, status, message: msg }),
    });
    if (res.ok) { setDone(true); onConfirmed?.(status); }
    setSaving(false);
  }

  const sandBorder = `${primaryColor}28`;

  return (
    <section style={{ padding: "4rem 1.5rem", background: bgColor }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase", color: primaryColor, fontFamily: "Georgia, serif", textAlign: "center", marginBottom: "0.4rem" }}>
          {t.rsvpEyebrow}
        </p>
        <h2 style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "1.9rem", color: textColor, fontWeight: 400, textAlign: "center", marginBottom: "2rem" }}>
          {t.rsvpTitle}
        </h2>

        {done ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: secondaryColor, borderRadius: "8px", border: `1px solid ${sandBorder}` }}>
            <Heart size={24} color={primaryColor} style={{ margin: "0 auto 1rem" }} />
            <p style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "1.2rem", color: textColor }}>{t.thankYou}</p>
            <p style={{ fontSize: "0.82rem", color: textColor, opacity: 0.5, marginTop: "0.25rem" }}>{t.confirmed}</p>
          </div>
        ) : (
          <div style={{ background: secondaryColor, borderRadius: "8px", border: `1px solid ${sandBorder}`, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Attendance toggle */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: "0.65rem", borderRadius: "4px",
                  border: `1px solid ${status === s ? primaryColor : sandBorder}`,
                  background: status === s ? primaryColor : "transparent",
                  color: status === s ? "#fff" : textColor,
                  opacity: status === s ? 1 : 0.55,
                  fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.2s",
                }}>
                  {s === "HADIR" ? t.attending : t.notAttending}
                </button>
              ))}
            </div>

            {/* Pax counter */}
            {status === "HADIR" && (
              <div>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: primaryColor, marginBottom: "0.6rem", fontFamily: "Georgia, serif" }}>
                  {t.guestCount}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    onClick={() => setPax(Math.max(1, pax - 1))}
                    style={{ width: 36, height: 36, borderRadius: "6px", border: `1px solid ${sandBorder}`, background: "transparent", color: textColor, cursor: "pointer", fontSize: "1.2rem", fontFamily: "Georgia, serif" }}
                  >−</button>
                  <span style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "1.5rem", color: textColor, minWidth: "2rem", textAlign: "center" }}>{pax}</span>
                  <button
                    onClick={() => setPax(Math.min(guest.maxPax, pax + 1))}
                    style={{ width: 36, height: 36, borderRadius: "6px", border: `1px solid ${sandBorder}`, background: "transparent", color: textColor, cursor: "pointer", fontSize: "1.2rem", fontFamily: "Georgia, serif" }}
                  >+</button>
                  <span style={{ fontSize: "0.72rem", color: textColor, opacity: 0.4, fontFamily: "Georgia, serif" }}>
                    {t.max} {guest.maxPax}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              placeholder={t.msgPlaceholder}
              style={{
                width: "100%", background: bgColor, border: `1px solid ${sandBorder}`,
                borderRadius: "4px", padding: "0.7rem 0.85rem", fontSize: "0.85rem",
                color: textColor, outline: "none", boxSizing: "border-box", resize: "none",
                fontFamily: "Georgia, serif",
              }}
            />

            {/* Submit */}
            <button
              onClick={submit}
              disabled={saving}
              style={{
                background: primaryColor, color: "#fff", border: "none", borderRadius: "4px",
                padding: "0.85rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "Georgia, serif",
                opacity: saving ? 0.6 : 1, transition: "opacity 0.2s",
              }}
            >
              {saving ? t.sending : t.confirmBtn}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function JackpotRSVPPlaceholder({ primaryColor, bgColor, secondaryColor, textColor, fontHeading, t }: {
  primaryColor: string; bgColor: string; secondaryColor: string; textColor: string; fontHeading: string;
  t: typeof LANGS[Lang];
}) {
  const sandBorder = `${primaryColor}28`;
  return (
    <section style={{ padding: "4rem 1.5rem", background: bgColor }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase", color: primaryColor, fontFamily: "Georgia, serif", textAlign: "center", marginBottom: "0.4rem" }}>
          {t.rsvpEyebrow}
        </p>
        <h2 style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "1.9rem", color: textColor, fontWeight: 400, textAlign: "center", marginBottom: "2rem" }}>
          {t.rsvpTitle}
        </h2>
        <div style={{ background: secondaryColor, borderRadius: "8px", border: `1px solid ${sandBorder}`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
          <LockKeyhole size={20} color={primaryColor} style={{ margin: "0 auto 1rem", opacity: 0.6 }} />
          <p style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "1.1rem", color: textColor }}>{t.rsvpTitle}</p>
          <p style={{ fontSize: "0.8rem", color: textColor, opacity: 0.45, marginTop: "0.4rem", lineHeight: 1.6, fontFamily: "Georgia, serif" }}>{t.rsvpLocked}</p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", pointerEvents: "none" }}>
            {[t.attending, t.notAttending].map((s) => (
              <div key={s} style={{ flex: 1, padding: "0.65rem", borderRadius: "4px", border: `1px solid ${sandBorder}`, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: `${primaryColor}55`, textAlign: "center", fontFamily: "Georgia, serif" }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Template ─────────────────────────────────────────────────────────────

export function LuckyJackpotTemplate({ guest, client, token }: Props) {
  const [opened, setOpened] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [lang, setLang] = useState<Lang>("EN");
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!showHero) return;
    function onScroll() { if (window.scrollY > 20) setShowHero(false); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showHero]);

  const profile = client.weddingProfile;
  const theme = client.theme;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);
  const t = LANGS[lang];

  const primaryColor = theme?.primaryColor || "#c9a84c";
  const secondaryColor = theme?.secondaryColor || "#fdf3d0";
  const bgColor = theme?.bgColor || "#fdf9f0";
  const textColor = theme?.textColor || "#2d1f0a";
  const fontHeading = theme?.fontHeading || "Cormorant Garamond";

  const showCountdown = !!theme?.showCountdown;
  const showMap = theme?.showMap !== false;
  const barcodeVisibility = theme?.barcodeVisibility ?? "AFTER_RSVP";
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const bgImage = client.galleries.find((g) => g.type === "BACKGROUND");
  const invitationLabels = INVITATION_LABEL[lang];
  const invitationLabel = invitationLabels[client.clientType as keyof typeof invitationLabels] || invitationLabels.WEDDING;

  // First upcoming event for the hero page teaser
  const firstEvent = client.events
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0] ?? null;

  const playMusicRef = useRef<(() => void) | null>(null);

  function handleOpen() {
    setOpened(true);
    setShowHero(true);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    playMusicRef.current?.();
  }

  return (
    <>
      <style>{`
        :root {
          --primary: ${primaryColor};
          --bg: ${bgColor};
          --text: ${textColor};
        }
        body { background-color: var(--bg); color: var(--text); }
        .font-heading { font-family: '${fontHeading}', Georgia, serif; }
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .border-primary { border-color: var(--primary); }
      `}</style>

      {music && (
        <MusicPlayer
          url={music.url}
          title={music.title}
          registerPlay={(fn) => { playMusicRef.current = fn; }}
        />
      )}

      {/* Lucky Jackpot opening cover */}
      {!opened && (
        <JackpotCover
          groomNickname={profile?.groomNickname || "Groom"}
          brideNickname={profile?.brideNickname || "Bride"}
          guestName={guest?.name}
          invitationLabel={invitationLabel}
          groomPhoto={profile?.showGroomPhoto ? profile?.groomPhoto : null}
          bridePhoto={profile?.showBridePhoto ? profile?.bridePhoto : null}
          primaryColor={primaryColor}
          bgColor={bgColor}
          fontHeading={fontHeading}
          lang={lang}
          onLangToggle={() => setLang((l) => l === "EN" ? "ID" : "EN")}
          onOpen={handleOpen}
        />
      )}

      {/* Hero page — shown after jackpot, dismissed on scroll */}
      <AnimatePresence>
        {showHero && (
          <motion.div
            key="hero-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center px-6"
            style={{ backgroundColor: bgColor }}
          >
            <StaggerWrap once className="flex flex-col items-center w-full max-w-sm">
              <StaggerItem>
                <p className="text-xs tracking-[0.28em] uppercase mb-6" style={{ color: `${primaryColor}88`, fontFamily: "Georgia, serif" }}>
                  {invitationLabel}
                </p>
              </StaggerItem>
              <StaggerItem>
                <h1 style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "clamp(2.5rem,10vw,4rem)", color: textColor, lineHeight: 1.1, marginBottom: 4 }}>
                  {profile?.groomNickname || "Groom"}
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", color: primaryColor, margin: "6px 0" }}>&amp;</p>
              </StaggerItem>
              <StaggerItem>
                <h1 style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "clamp(2.5rem,10vw,4rem)", color: textColor, lineHeight: 1.1 }}>
                  {profile?.brideNickname || "Bride"}
                </h1>
              </StaggerItem>
              <StaggerItem>
                <div className="mt-6 h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
              </StaggerItem>
              {profile?.openingQuote && (
                <StaggerItem>
                  <div className="mt-6 text-center px-2">
                    <p style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "0.78rem", fontStyle: "italic", lineHeight: 1.9, color: textColor, opacity: 0.55 }}>
                      &ldquo;{profile.openingQuote}&rdquo;
                    </p>
                    {profile.openingQuoteBy && (
                      <p className="text-xs mt-1" style={{ color: primaryColor, fontFamily: "Georgia, serif", opacity: 0.7, letterSpacing: "0.1em" }}>
                        — {profile.openingQuoteBy}
                      </p>
                    )}
                  </div>
                </StaggerItem>
              )}
              {guest?.name && (
                <StaggerItem>
                  <div className="mt-5">
                    <p className="text-xs tracking-widest uppercase" style={{ color: `${primaryColor}77`, fontFamily: "Georgia, serif", marginBottom: 4 }}>
                      {t.dearGuest}
                    </p>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: textColor }}>
                      {guest.name}
                    </p>
                  </div>
                </StaggerItem>
              )}
              {firstEvent?.date && (
                <StaggerItem>
                  <p className="mt-4 text-xs" style={{ color: `${primaryColor}88`, fontFamily: "Georgia, serif", letterSpacing: "0.08em" }}>
                    {formatDate(firstEvent.date)} · {firstEvent.venueName}
                  </p>
                </StaggerItem>
              )}
              <StaggerItem>
                <p className="mt-8 text-xs tracking-widest uppercase" style={{ color: `${primaryColor}55`, fontFamily: "Georgia, serif", animation: "jackpot-bounce 1.8s ease-in-out infinite" }}>
                  {t.scrollHint}
                </p>
              </StaggerItem>
            </StaggerWrap>
            <style>{`@keyframes jackpot-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent lang toggle (visible after opened) */}
      {opened && (
        <div
          className="fixed z-50"
          style={{
            bottom: 82,
            right: 24,
            display: "flex",
            alignItems: "center",
            background: bgColor,
            border: `1px solid ${primaryColor}33`,
            borderRadius: 99,
            padding: 3,
            boxShadow: `0 2px 12px ${primaryColor}22`,
          }}
        >
          {(["ID", "EN"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                fontFamily: "Georgia, serif",
                padding: "4px 11px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                background: lang === l ? primaryColor : "transparent",
                color: lang === l ? "#fff" : `${primaryColor}77`,
                fontWeight: lang === l ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {opened && <FloatingOrnaments color={primaryColor} />}

      {/* Main invitation content */}
      <div
        className={`min-h-screen transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={
          bgImage
            ? { backgroundImage: `url('${bgImage.url}')`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {bgImage && opened && (
          <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `${bgColor}cc`, zIndex: 0 }} />
        )}

        <div className="relative z-10">
          {/* Countdown */}
          {showCountdown && countdownTimeLeft && (
            <RevealSection>
              <section className="py-12 text-center" style={{ background: secondaryColor }}>
                <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
                  {t.countdownLabel}
                </p>
                <div className="flex justify-center gap-6">
                  {[
                    { v: countdownTimeLeft.days, l: t.days },
                    { v: countdownTimeLeft.hours, l: t.hours },
                    { v: countdownTimeLeft.minutes, l: t.minutes },
                    { v: countdownTimeLeft.seconds, l: t.seconds },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center min-w-12">
                      <div
                        className="font-light"
                        style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "2.4rem", color: primaryColor, lineHeight: 1 }}
                      >
                        {String(v).padStart(2, "0")}
                      </div>
                      <div className="text-xs tracking-[0.16em] uppercase mt-1" style={{ color: textColor, opacity: 0.45 }}>
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </RevealSection>
          )}

          {sectionKeys.includes("COUPLE") && <JackpotCoupleSection profile={profile} lang={lang} />}
          {profile?.attentionContent && (
            <AttentionSection
              title={profile.attentionTitle}
              content={profile.attentionContent}
              primaryColor={primaryColor}
              bgColor={bgColor}
              textColor={textColor}
            />
          )}
          {sectionKeys.includes("EVENT") && <JackpotEventSection events={client.events} showMap={showMap} lang={lang} />}
          {sectionKeys.includes("GALLERY") && <RevealSection><GallerySection galleries={client.galleries} /></RevealSection>}

          {sectionKeys.includes("RSVP") && (
            <RevealSection>
              {token && guest
                ? <JackpotRSVP clientId={client.id} guest={guest} token={token} primaryColor={primaryColor} bgColor={bgColor} secondaryColor={secondaryColor} textColor={textColor} fontHeading={fontHeading} t={t} onConfirmed={setConfirmedRsvpStatus} />
                : <JackpotRSVPPlaceholder primaryColor={primaryColor} bgColor={bgColor} secondaryColor={secondaryColor} textColor={textColor} fontHeading={fontHeading} t={t} />
              }
            </RevealSection>
          )}

          {guest?.barcodeChurch && (barcodeVisibility === "ALWAYS" || (barcodeVisibility === "AFTER_RSVP" && confirmedRsvpStatus === "HADIR")) && (
            <RevealSection>
              <BarcodeSection
                barcodeChurch={guest.barcodeChurch}
                barcodeReception={guest.barcodeReception ?? null}
                invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
                churchLabel={getEventLabel(client.events.find((e) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.type ?? client.events[0]?.type ?? "ACARA")}
                receptionLabel={getEventLabel(client.events.find((e) => e.type === "RESEPSI")?.type ?? "RESEPSI")}
                churchVenueName={client.events.find((e) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.venueName || client.events[0]?.venueName || "Venue"}
                receptionVenueName={client.events.find((e) => e.type === "RESEPSI")?.venueName || "Resepsi"}
                primaryColor={primaryColor}
                bgColor={bgColor}
                fontHeading={fontHeading}
              />
            </RevealSection>
          )}

          {sectionKeys.includes("WISHES") && (
            <RevealSection>
              <WishesSection
                clientId={client.id}
                initialWishes={client.wishes}
                guestName={guest?.name}
                guestId={guest?.id}
                lang={lang}
              />
            </RevealSection>
          )}

          {sectionKeys.includes("GIFT") && <RevealSection><GiftSection gifts={client.gifts} lang={lang} /></RevealSection>}

          <RevealSection>
            <footer className="py-10 text-center text-xs" style={{ color: `${textColor}66` }}>
              <p
                className="text-2xl mb-2"
                style={{ fontFamily: `'${fontHeading}', Georgia, serif`, color: textColor, opacity: 0.7 }}
              >
                {profile?.groomNickname} &amp; {profile?.brideNickname}
              </p>
              <p>{t.closingText}</p>
              <p className="mt-4 opacity-40">{t.madeWith}</p>
            </footer>
          </RevealSection>
        </div>
      </div>
    </>
  );
}
