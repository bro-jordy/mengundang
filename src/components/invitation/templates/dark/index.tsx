"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, Calendar, Copy, Check, Wallet, QrCode, Gift, Send, Heart, LockKeyhole } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventLabel } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import type { Rsvp } from "@/types/prisma.types";
import { formatDate } from "@/lib/utils";

// Convert plain-text story (legacy) to HTML; HTML content passes through unchanged
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
  attentionTitle: string | null; attentionContent: string | null;
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
    theme: { primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null; showMap?: boolean | null; barcodeVisibility?: string | null } | null;
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

// ─── Main Template ────────────────────────────────────────────────────────────

export function DarkTemplate({ guest, client, token }: Props) {
  const [opened, setOpened] = useState(false);
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );
  const [coverGone, setCoverGone] = useState(false);
  const profile = client.weddingProfile;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);

  // ── Gallery lookups ──
  const heroGallery  = client.galleries.find((g) => g.type === "HERO");
  const coverImage   = client.galleries.find((g) => g.type === "COVER");
  const bgImage      = client.galleries.find((g) => g.type === "BACKGROUND");
  // HERO gallery = condensed header photo; fallback to COVER
  const heroImage    = heroGallery?.url || coverImage?.url;

  const fontHeading     = client.theme?.fontHeading    || "Cormorant";
  const fontBody        = client.theme?.fontBody       || "IBM Plex Sans";
  const rose            = client.theme?.primaryColor   || "#c4a07a";
  const textColor       = client.theme?.textColor      || "#f0ece6";
  const bgColor         = client.theme?.bgColor        || "#ffffff";
  const secondaryColor  = client.theme?.secondaryColor || "#f9f9f9";
  const invitationLabel = INVITATION_LABEL[client.clientType] || "The Wedding Of";
  const coupleLabel = profile
    ? `${profile.groomNickname || profile.groomName} & ${profile.brideNickname || profile.brideName}`
    : "Groom & Bride";

  const showCountdown = !!client.theme?.showCountdown;
  const showMap = client.theme?.showMap !== false;
  const barcodeVisibility = client.theme?.barcodeVisibility ?? "AFTER_RSVP";
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const playMusicRef = useRef<(() => void) | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  function handleOpen() {
    setOpened(true);
    window.scrollTo(0, 0);
    // Fire play() immediately — still inside user gesture, browser allows autoplay
    playMusicRef.current?.();
  }

  function onCoverTransitionEnd() {
    if (opened) setCoverGone(true);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        body { background-color: #ffffff; color: #1a1a1a; margin: 0; -webkit-font-smoothing: antialiased; font-family: '${fontBody}', 'IBM Plex Sans', sans-serif; }
        .story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .story-html li { margin: 0.15em 0; }
        .story-html strong, .story-html b { font-weight: 600; opacity: 1; }
        .story-html em, .story-html i { font-style: italic; }
        .story-html p { margin: 0.4em 0; }
        .story-html p:first-child { margin-top: 0; }
        .story-html p:last-child { margin-bottom: 0; }
      `}</style>

      {music && (
        <MusicPlayer
          url={music.url}
          title={music.title}
          registerPlay={(fn) => { playMusicRef.current = fn; }}
        />
      )}

      {/* ── COVER ── */}
      <div
        style={{
          display: coverGone ? "none" : undefined,
          height: opened ? 0 : "100dvh",
          overflow: "hidden",
          willChange: "height",
          transition: "height 640ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onTransitionEnd={onCoverTransitionEnd}
      >
        <div
          className="relative flex flex-col justify-start"
          style={{
            height: "100dvh",
            backgroundImage: heroImage ? `url('${heroImage}')` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: heroImage ? undefined : "#1a1a1a",
          }}
        >
          <div className="absolute inset-0" style={{
            background: heroImage
              ? "linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.05) 100%)"
              : "linear-gradient(160deg, #1a1a1a 0%, #2a2a2a 100%)",
          }} />

          {/* Cover selalu pakai teks putih karena background gelap (foto/overlay) */}
          <div className="relative z-10 px-8 text-center" style={{ paddingTop: "33vh" }}>
            <p className="italic font-light tracking-wide mb-2"
              style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: "#1a1a1a", opacity: 0.8, fontSize: "1rem" }}>
              {invitationLabel}
            </p>
            <h1 className="font-light"
              style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: "#1a1a1a", fontSize: "2.75rem", lineHeight: 1.1 }}>
              {coupleLabel}
            </h1>
            <div className="my-5 flex items-center justify-center">
              <div className="h-px w-16" style={{ backgroundColor: rose, opacity: 0.8 }} />
            </div>
            {guest ? (
              <div className="mb-8 text-center">
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  To <span className="font-semibold text-white">{guest.name}</span>,
                </p>
                <p className="text-sm leading-relaxed max-w-xs mx-auto font-light" style={{ color: "rgba(0, 0, 0, 0.6)" }}>
                  Dengan hormat kami mengundang Bapak/Ibu menyaksikan pernikahan kami. Kehadiran Bapak/Ibu akan menyempurnakan hari bahagia kami.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-sm leading-relaxed max-w-xs mx-auto font-light" style={{ color: "rgba(0, 0, 0, 0.6)" }}>
                  Dengan hormat kami mengundang Anda menyaksikan hari istimewa kami.
                </p>
              </div>
            )}
            <button onClick={handleOpen} className="mx-auto block font-medium text-sm tracking-wide"
              style={{ background: rose, color: "#1a1a1a", borderRadius: "9999px", padding: "14px 48px", border: "none", cursor: "pointer" }}>
              Buka Undangan
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        background: bgImage ? undefined : "#ffffff",
        backgroundImage: bgImage ? `url('${bgImage.url}')` : undefined,
        backgroundAttachment: bgImage ? "fixed" : undefined,
        backgroundSize: bgImage ? "cover" : undefined,
        backgroundPosition: bgImage ? "center" : undefined,
        position: "relative",
      }}>
        {/* BG overlay to keep readability */}
        {bgImage && (
          <div className="fixed inset-0 pointer-events-none" style={{ background: "rgba(255,255,255,0.72)", zIndex: 0 }} />
        )}

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ── Hero: photo with faded edges + full-width glass bubble ── */}
          <div className="relative overflow-hidden" style={{ height: "160px" }}>
            {/* Photo / gradient background */}
            {heroImage ? (
              <>
                <div className="absolute inset-0" style={{
                  backgroundImage: `url('${heroImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center 20%",
                }} />
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
              </>
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }} />
            )}

            {/* Edge fades — blend photo into page background */}
            <div className="absolute inset-y-0 left-0 pointer-events-none" style={{
              width: "22%", zIndex: 2,
              background: `linear-gradient(to right, ${bgColor} 0%, transparent 100%)`,
            }} />
            <div className="absolute inset-y-0 right-0 pointer-events-none" style={{
              width: "22%", zIndex: 2,
              background: `linear-gradient(to left, ${bgColor} 0%, transparent 100%)`,
            }} />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
              height: "40%", zIndex: 2,
              background: `linear-gradient(to top, ${bgColor} 0%, transparent 100%)`,
            }} />

            {/* Full-width glass bubble — centered vertically */}
            <div
              className="absolute left-0 right-0 text-center"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderTop: "1px solid rgba(255,255,255,0.25)",
                borderBottom: "1px solid rgba(255,255,255,0.25)",
                padding: "20px 24px",
              }}
            >
              <p
                className="italic font-light text-sm mb-1"
                style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor, opacity: 0.7 }}
              >
                {invitationLabel}
              </p>
              <h2
                className="font-light"
                style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, fontSize: "1.9rem", lineHeight: 1.2, color: textColor }}
              >
                {coupleLabel}
              </h2>
            </div>
          </div>

          {/* ── Countdown ── */}
          {showCountdown && countdownTimeLeft && (
            <section style={{ padding: "3rem 1.5rem", background: secondaryColor, textAlign: "center" }}>
              <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: rose, opacity: 0.7 }}>
                Menuju Hari Bahagia
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                {[{ v: countdownTimeLeft.days, l: "Hari" }, { v: countdownTimeLeft.hours, l: "Jam" }, { v: countdownTimeLeft.minutes, l: "Menit" }, { v: countdownTimeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: "center", minWidth: "3rem" }}>
                    <div style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, fontSize: "2.4rem", fontWeight: 300, color: rose, lineHeight: 1 }}>
                      {String(v).padStart(2, "0")}
                    </div>
                    <div className="text-xs tracking-[0.18em] uppercase mt-1" style={{ color: textColor, opacity: 0.4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Couple ── */}
          {sectionKeys.includes("COUPLE") && profile && (
            <CoupleSection profile={profile} rose={rose} fontHeading={fontHeading}
              textColor={textColor} bgColor={bgColor} />
          )}

          {profile?.attentionContent && (
            <AttentionSection
              title={profile.attentionTitle}
              content={profile.attentionContent}
              primaryColor={rose}
              bgColor={bgColor}
              textColor={textColor}
              fontBody={fontBody}
            />
          )}

          {/* ── Events ── */}
          {sectionKeys.includes("EVENT") && (
            <EventSection events={client.events} rose={rose} fontHeading={fontHeading}
              textColor={textColor} bgColor={bgColor} secondaryColor={secondaryColor} showMap={showMap} />
          )}

          {/* ── Gallery ── */}
          {sectionKeys.includes("GALLERY") && (
            <GallerySection galleries={client.galleries} rose={rose} fontHeading={fontHeading}
              textColor={textColor} bgColor={bgColor} />
          )}

          {/* ── RSVP ── */}
          {sectionKeys.includes("RSVP") && (
            token && guest
              ? <RSVPSection clientId={client.id} guest={guest} token={token} rose={rose} fontHeading={fontHeading}
                  textColor={textColor} bgColor={bgColor} secondaryColor={secondaryColor} onConfirmed={setConfirmedRsvpStatus} />
              : <RSVPPlaceholder rose={rose} fontHeading={fontHeading}
                  textColor={textColor} bgColor={bgColor} secondaryColor={secondaryColor} />
          )}

          {guest?.barcodeChurch && (barcodeVisibility === "ALWAYS" || (barcodeVisibility === "AFTER_RSVP" && confirmedRsvpStatus === "HADIR")) && (
            <BarcodeSection
              barcodeChurch={guest.barcodeChurch}
              barcodeReception={guest.barcodeReception ?? null}
              invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
              churchLabel={getEventLabel(client.events.find((e) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.type ?? client.events[0]?.type ?? "ACARA")}
              receptionLabel={getEventLabel(client.events.find((e) => e.type === "RESEPSI")?.type ?? "RESEPSI")}
              churchVenueName={client.events.find((e) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY")?.venueName || client.events[0]?.venueName || "Venue"}
              receptionVenueName={client.events.find((e) => e.type === "RESEPSI")?.venueName || "Resepsi"}
              primaryColor={rose}
              bgColor={bgColor}
              fontHeading={fontHeading}
            />
          )}

          {/* ── Wishes ── */}
          {sectionKeys.includes("WISHES") && (
            <WishesSection
              clientId={client.id}
              initialWishes={client.wishes}
              guestName={guest?.name}
              guestId={guest?.id}
              rose={rose}
              fontHeading={fontHeading}
              textColor={textColor}
              bgColor={bgColor}
              secondaryColor={secondaryColor}
            />
          )}

          {/* ── Gift ── */}
          {sectionKeys.includes("GIFT") && (
            <GiftSection gifts={client.gifts} rose={rose} fontHeading={fontHeading}
              textColor={textColor} bgColor={bgColor} secondaryColor={secondaryColor} />
          )}

          {/* ── Footer ── */}
          <footer className="py-12 text-center" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-10" style={{ backgroundColor: "rgba(196,160,122,0.4)" }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rose }} />
              <div className="h-px w-10" style={{ backgroundColor: "rgba(196,160,122,0.4)" }} />
            </div>
            <p className="font-light text-2xl mb-2"
              style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: rose }}>
              {coupleLabel}
            </p>
            {/* <p className="text-xs tracking-widest text-white/40 uppercase">Terima kasih atas doa dan kehadirannya</p> */}
             <p className="text-xs tracking-widest text-white/40 uppercase">2026</p>
            <p className="text-xs text-white/20 mt-4">Made with ❤️</p>
          </footer>
        </div>
      </div>
    </>
  );
}

// ─── Couple Section ───────────────────────────────────────────────────────────

function CoupleSection({ profile, rose, fontHeading, textColor, bgColor }: {
  profile: NonNullable<Profile>; rose: string; fontHeading: string; textColor: string; bgColor: string;
}) {
  return (
    <section className="py-16 px-6" style={{ background: bgColor }}>
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-light text-3xl mb-10"
          style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
          Pasangan Mempelai
        </h2>

        {/* Groom */}
        <div className="flex flex-col items-center mb-6">
          {profile.showGroomPhoto && (
            profile.groomPhoto ? (
              <img src={profile.groomPhoto} alt={profile.groomName} className="rounded-full object-cover mb-5"
                style={{ width: "170px", height: "170px", objectFit: "cover" }} />
            ) : (
              <div className="rounded-full mb-5 bg-stone-100 flex items-center justify-center"
                style={{ width: "170px", height: "170px" }}>
                <span className="text-5xl text-stone-300">👤</span>
              </div>
            )
          )}
          <h3 className="font-medium text-2xl"
            style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
            {profile.groomName}
          </h3>
          {profile.groomParents && (
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: textColor, opacity: 0.55 }}>{profile.groomParents}</p>
          )}
        </div>

        <p className="italic font-light text-4xl my-4"
          style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: rose }}>&amp;</p>

        {/* Bride */}
        <div className="flex flex-col items-center mt-6">
          {profile.showBridePhoto && (
            profile.bridePhoto ? (
              <img src={profile.bridePhoto} alt={profile.brideName} className="rounded-full object-cover mb-5"
                style={{ width: "170px", height: "170px", objectFit: "cover" }} />
            ) : (
              <div className="rounded-full mb-5 bg-stone-100 flex items-center justify-center"
                style={{ width: "170px", height: "170px" }}>
                <span className="text-5xl text-stone-300">👤</span>
              </div>
            )
          )}
          <h3 className="font-medium text-2xl"
            style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
            {profile.brideName}
          </h3>
          {profile.brideParents && (
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: textColor, opacity: 0.55 }}>{profile.brideParents}</p>
          )}
        </div>

        {/* Opening quote */}
        {profile.openingQuote && (
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${textColor}18` }}>
            <p className="text-lg italic font-light leading-relaxed"
              style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor, opacity: 0.6 }}>
              &ldquo;{profile.openingQuote}&rdquo;
            </p>
            {profile.openingQuoteBy && (
              <p className="text-xs mt-2" style={{ color: textColor, opacity: 0.4 }}>— {profile.openingQuoteBy}</p>
            )}
          </div>
        )}

        {/* Story */}
        {profile.story && (
          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${textColor}18` }}>
            {profile.showStoryTitle && (
              <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: textColor, opacity: 0.4 }}>
                {profile.storyTitle?.trim() || "Cerita Singkat Pasangan"}
              </p>
            )}
            <div
              className="story-html text-sm font-light leading-relaxed"
              style={{ color: textColor, opacity: 0.6 }}
              dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Event Section ────────────────────────────────────────────────────────────

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

function EventSection({ events, rose, fontHeading, textColor, bgColor, secondaryColor, showMap }: {
  events: Props["client"]["events"]; rose: string; fontHeading: string;
  textColor: string; bgColor: string; secondaryColor: string; showMap: boolean;
}) {
  if (!events.length) return null;
  return (
    <section className="py-16 px-6" style={{ background: secondaryColor }}>
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: textColor, opacity: 0.45 }}>Jadwal Acara</p>
          <h2 className="font-light text-3xl"
            style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
            Detail Acara
          </h2>
          <div className="h-px w-10 mx-auto mt-4" style={{ backgroundColor: rose }} />
        </div>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl p-6 shadow-sm" style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
              <h3 className="font-light text-xl text-center mb-4"
                style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
                {event.label || EVENT_LABEL[event.type] || event.type}
              </h3>
              <div className="space-y-2.5">
                {event.date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={14} style={{ color: rose }} className="mt-0.5 shrink-0" />
                    <p className="text-sm" style={{ color: textColor, opacity: 0.75 }}>{formatDate(event.date)}</p>
                  </div>
                )}
                {(event.timeStart || event.timeEnd) && (
                  <div className="flex items-start gap-3">
                    <Clock size={14} style={{ color: rose }} className="mt-0.5 shrink-0" />
                    <p className="text-sm" style={{ color: textColor, opacity: 0.75 }}>
                      {event.timeStart}{event.timeEnd && ` – ${event.timeEnd}`} WIB
                    </p>
                  </div>
                )}
                {event.venueName && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} style={{ color: rose }} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.8 }}>{event.venueName}</p>
                      {event.venueAddress && <p className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.45 }}>{event.venueAddress}</p>}
                    </div>
                  </div>
                )}
              </div>
              {showMap && event.mapsUrl && event.venueName && (
                <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${rose}22` }}>
                  <iframe
                    src={getMapEmbedUrl(event.mapsUrl, event.venueName, event.venueAddress)}
                    width="100%" height="200"
                    style={{ display: "block", border: "none" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={event.venueName}
                  />
                </div>
              )}
              {event.mapsUrl && (
                <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-5 w-full flex items-center justify-center gap-2 text-xs tracking-widest uppercase py-2.5 rounded-full border transition-colors"
                  style={{ borderColor: rose, color: rose }}>
                  <MapPin size={12} /> Buka Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section — infinite loop, swipe only ─────────────────────────────

const CARD_W = 260;
const CARD_GAP = 14;
const STEP = CARD_W + CARD_GAP;

function GallerySection({ galleries, rose, fontHeading, textColor, bgColor }: {
  galleries: Props["client"]["galleries"]; rose: string; fontHeading: string; textColor: string; bgColor: string;
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
    // Only fire for the track's own transform, not bubbled child transitions
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    if (count <= 1) return;
    if (idx === 0) { setAnimated(false); setIdx(count); }
    else if (idx === extended.length - 1) { setAnimated(false); setIdx(1); }
  }

  function goNext() { setIdx((i) => i + 1); }
  function goPrev() { setIdx((i) => i - 1); }

  // Pointer events only — handles both touch and mouse, no double-fire on mobile
  function onPointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX; dragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 5)
      dragging.current = true;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (!dragging.current || Math.abs(dx) < 30) return;
    dx < 0 ? goNext() : goPrev();
  }

  return (
    <section className="py-16" style={{ background: bgColor }}>
      <div className="text-center mb-8 px-6">
        <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: textColor, opacity: 0.45 }}>Momen</p>
        <h2 className="font-light text-3xl"
          style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
          Galeri
        </h2>
        <div className="h-px w-10 mx-auto mt-4" style={{ backgroundColor: rose }} />
      </div>

      <div
        style={{ overflow: "hidden", cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            paddingLeft: `calc(50vw - ${CARD_W / 2}px)`,
            paddingRight: `calc(50vw - ${CARD_W / 2}px)`,
            transform: `translateX(-${idx * STEP}px)`,
            transition: animated ? "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((photo, i) => {
            const isCurrent = i === idx;
            return (
              <div key={`${photo.id}-${i}`} style={{
                flexShrink: 0, width: `${CARD_W}px`,
                borderRadius: "16px", overflow: "hidden", pointerEvents: "none",
                transition: animated ? "opacity 400ms ease, transform 400ms ease, box-shadow 400ms ease" : "none",
                opacity: isCurrent ? 1 : 0.38,
                transform: isCurrent ? "scale(1)" : "scale(0.85)",
                boxShadow: isCurrent ? "0 24px 48px rgba(0,0,0,0.13)" : "0 4px 12px rgba(0,0,0,0.05)",
              }}>
                <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" draggable={false} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

function RSVPSection({ clientId, guest, token, rose, fontHeading, textColor, bgColor, secondaryColor, onConfirmed }: {
  clientId: string; guest: Guest; token: string; rose: string; fontHeading: string;
  textColor: string; bgColor: string; secondaryColor: string;
  onConfirmed?: (status: "HADIR" | "TIDAK_HADIR") => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">((guest.rsvp?.status as "HADIR" | "TIDAK_HADIR") || "HADIR");
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

  return (
    <section className="py-16 px-6" style={{ background: secondaryColor }}>
      <div className="max-w-sm mx-auto">
        <RSVPHeader rose={rose} fontHeading={fontHeading} textColor={textColor} />
        {done ? (
          <div className="text-center py-10 rounded-2xl shadow-sm" style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${rose}15` }}>
              <Heart size={20} style={{ color: rose }} />
            </div>
            <p className="font-medium" style={{ color: textColor }}>Terima kasih!</p>
            <p className="text-sm mt-1" style={{ color: textColor, opacity: 0.5 }}>Konfirmasi kehadiran telah diterima</p>
          </div>
        ) : (
          <div className="rounded-2xl shadow-sm p-6 space-y-4" style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
            <div className="flex gap-3">
              {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-2.5 text-xs tracking-widest uppercase rounded-full transition-all"
                  style={{ border: `1px solid ${status === s ? rose : textColor + "20"}`, color: status === s ? rose : textColor + "60", background: status === s ? `${rose}18` : "transparent" }}>
                  {s === "HADIR" ? "Hadir" : "Tidak Hadir"}
                </button>
              ))}
            </div>
            {status === "HADIR" && (
              <div>
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: textColor, opacity: 0.45 }}>Jumlah Tamu</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg" style={{ borderColor: `${textColor}25`, color: textColor }}>−</button>
                  <span className="text-xl font-light" style={{ fontFamily: `'${fontHeading}', Cormorant, serif`, color: textColor }}>{pax}</span>
                  <button onClick={() => setPax(Math.min(guest.maxPax, pax + 1))} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg" style={{ borderColor: `${textColor}25`, color: textColor }}>+</button>
                  <span className="text-xs" style={{ color: textColor, opacity: 0.4 }}>maks. {guest.maxPax}</span>
                </div>
              </div>
            )}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              placeholder="Pesan atau doa (opsional)"
              className="w-full text-sm font-light resize-none focus:outline-none p-3 rounded-xl border"
              style={{ borderColor: `${textColor}20`, color: textColor, background: secondaryColor }} />
            <button onClick={submit} disabled={saving}
              className="w-full py-3 text-sm font-medium rounded-full transition-all disabled:opacity-40"
              style={{ background: rose, color: "#1a1a1a" }}>
              {saving ? "Mengirim..." : "Konfirmasi Kehadiran"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function RSVPPlaceholder({ rose, fontHeading, textColor, bgColor, secondaryColor }: {
  rose: string; fontHeading: string; textColor: string; bgColor: string; secondaryColor: string;
}) {
  return (
    <section className="py-16 px-6" style={{ background: secondaryColor }}>
      <div className="max-w-sm mx-auto">
        <RSVPHeader rose={rose} fontHeading={fontHeading} textColor={textColor} />
        <div className="rounded-2xl shadow-sm p-8 text-center" style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${rose}15` }}>
            <LockKeyhole size={20} style={{ color: rose }} />
          </div>
          <p className="font-medium mb-1" style={{ color: textColor }}>Konfirmasi Kehadiran</p>
          <p className="text-sm leading-relaxed" style={{ color: textColor, opacity: 0.5 }}>
            RSVP tersedia melalui link undangan personal yang dikirimkan ke tamu.
          </p>
          <div className="mt-5 flex gap-3">
            {["Hadir", "Tidak Hadir"].map((s) => (
              <div key={s} className="flex-1 py-2.5 text-xs tracking-widest uppercase rounded-full"
                style={{ border: `1px solid ${textColor}20`, color: `${textColor}40` }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RSVPHeader({ rose, fontHeading, textColor }: { rose: string; fontHeading: string; textColor: string }) {
  return (
    <div className="text-center mb-8">
      <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: textColor, opacity: 0.45 }}>Konfirmasi</p>
      <h2 className="font-light text-3xl" style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>RSVP</h2>
      <div className="h-px w-10 mx-auto mt-4" style={{ backgroundColor: rose }} />
    </div>
  );
}

// ─── Wishes Section ───────────────────────────────────────────────────────────

function WishesSection({ clientId, initialWishes, guestName, guestId, rose, fontHeading, textColor, bgColor, secondaryColor }: {
  clientId: string; initialWishes: Props["client"]["wishes"];
  guestName?: string; guestId?: string; rose: string; fontHeading: string;
  textColor: string; bgColor: string; secondaryColor: string;
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

  return (
    <section className="py-16 px-6" style={{ background: bgColor }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: textColor, opacity: 0.45 }}>Pesan</p>
          <h2 className="font-light text-3xl" style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>
            Ucapan &amp; Doa
          </h2>
          <div className="h-px w-10 mx-auto mt-4" style={{ backgroundColor: rose }} />
        </div>
        <div className="space-y-3 mb-6 p-5 rounded-2xl" style={{ background: secondaryColor }}>
          {!guestName && (
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda"
              className="w-full text-sm p-3 rounded-xl focus:outline-none"
              style={{ border: `1px solid ${textColor}20`, color: textColor, background: bgColor }} />
          )}
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
            placeholder="Tulis doa dan ucapan..."
            className="w-full text-sm font-light resize-none p-3 rounded-xl focus:outline-none"
            style={{ border: `1px solid ${textColor}20`, color: textColor, background: bgColor }} />
          <button onClick={send} disabled={sending || !msg.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-full transition-all disabled:opacity-40"
            style={{ background: rose, color: "#1a1a1a" }}>
            <Send size={13} /> {sent ? "Terkirim!" : sending ? "Mengirim..." : "Kirim Ucapan"}
          </button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {wishes.map((w) => (
            <div key={w.id} className="p-4 rounded-xl" style={{ background: secondaryColor, border: `1px solid ${textColor}10` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: rose }}>{w.name}</p>
              <p className="text-sm font-light leading-relaxed" style={{ color: textColor, opacity: 0.65 }}>{w.message}</p>
              {w.reply && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${textColor}12` }}>
                  <p className="text-xs mb-0.5" style={{ color: rose, opacity: 0.7 }}>Balasan</p>
                  <p className="text-xs font-light leading-relaxed italic" style={{ color: textColor, opacity: 0.55 }}>{w.reply}</p>
                </div>
              )}
            </div>
          ))}
          {wishes.length === 0 && <p className="text-center text-sm py-4" style={{ color: textColor, opacity: 0.4 }}>Belum ada ucapan</p>}
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
  return { from: "#292524", to: "#57534e" };
}

function GiftSection({ gifts, rose, fontHeading, textColor, bgColor, secondaryColor }: {
  gifts: Props["client"]["gifts"]; rose: string; fontHeading: string;
  textColor: string; bgColor: string; secondaryColor: string;
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
    <section className="py-16 px-6" style={{ background: secondaryColor }}>
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: textColor, opacity: 0.45 }}>Hadiah</p>
          <h2 className="font-light text-3xl" style={{ fontFamily: `'${fontHeading}', Cormorant, Georgia, serif`, color: textColor }}>Amplop Digital</h2>
          <div className="h-px w-10 mx-auto mt-4" style={{ backgroundColor: rose }} />
          <p className="text-sm mt-4 leading-relaxed max-w-xs mx-auto font-light" style={{ color: textColor, opacity: 0.55 }}>
            Doa restu Anda adalah hadiah terbaik. Namun jika berkenan memberikan hadiah, berikut informasinya.
          </p>
        </div>
        <div className="space-y-4">
          {banks.map((gift) => {
            const bt = getBankTheme(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <div key={gift.id} className="rounded-2xl overflow-hidden shadow-lg relative"
                style={{ background: `linear-gradient(135deg, ${bt.from}, ${bt.to})`, aspectRatio: "1.586/1", minHeight: "190px" }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%)" }} />
                <div className="relative z-10 h-full flex flex-col justify-between p-5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-lg uppercase">{gift.bankName}</span>
                    <span className="text-white/40 text-xs uppercase tracking-widest">Transfer Bank</span>
                  </div>
                  <p className="font-mono text-white text-lg tracking-[0.2em]">
                    {(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Atas Nama</p>
                      <p className="text-white text-sm font-medium uppercase">{gift.accountName}</p>
                    </div>
                    <button onClick={() => copy(key, gift.accountNumber || "")}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white"
                      style={{ border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", borderRadius: "6px" }}>
                      {copiedId === key ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {ewallets.map((gift) => {
            const key = `ew-${gift.id}`;
            return (
              <div key={gift.id} className="p-5 rounded-2xl shadow-sm flex items-center gap-4"
                style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
                <div className="p-3 rounded-xl shrink-0" style={{ background: `${rose}15` }}><Wallet size={18} style={{ color: rose }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: textColor, opacity: 0.45 }}>E-Wallet</p>
                  <p className="font-semibold" style={{ color: textColor }}>{gift.ewalletType}</p>
                  <p className="font-mono text-sm mt-0.5" style={{ color: textColor, opacity: 0.65 }}>{gift.ewalletNumber}</p>
                </div>
                <button onClick={() => copy(key, gift.ewalletNumber || "")}
                  className="p-2.5 rounded-xl transition-colors" style={{ color: textColor, opacity: 0.5 }}>
                  {copiedId === key ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                </button>
              </div>
            );
          })}
          {qrisList.map((gift) => (
            <div key={gift.id} className="rounded-2xl shadow-sm overflow-hidden"
              style={{ background: bgColor, border: `1px solid ${textColor}12` }}>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl shrink-0" style={{ background: `${rose}15` }}><QrCode size={18} style={{ color: rose }} /></div>
                  <div>
                    <p className="text-xs" style={{ color: textColor, opacity: 0.45 }}>QRIS</p>
                    <p className="font-semibold" style={{ color: textColor }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                  </div>
                </div>
                <button onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)}
                  className="text-xs font-medium uppercase tracking-widest py-1.5 px-3 rounded-full border transition-colors"
                  style={{ borderColor: rose, color: rose }}>
                  {qrisOpen === gift.id ? "Tutup" : "Lihat QR"}
                </button>
              </div>
              {qrisOpen === gift.id && (
                <div className="px-5 pb-5 flex flex-col items-center pt-4" style={{ borderTop: `1px solid ${textColor}10` }}>
                  <img src={gift.qrisImage!} alt="QRIS" className="max-w-[200px] w-full rounded-xl" style={{ border: `1px solid ${textColor}15` }} />
                  <p className="text-xs mt-2" style={{ color: textColor, opacity: 0.4 }}>Scan untuk transfer</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Gift size={18} className="mx-auto mb-2" style={{ color: textColor, opacity: 0.3 }} />
          <p className="text-xs" style={{ color: textColor, opacity: 0.4 }}>Terima kasih atas kasih sayang Anda</p>
        </div>
      </div>
    </section>
  );
}
