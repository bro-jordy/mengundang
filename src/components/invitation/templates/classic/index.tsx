"use client";

import { useState, useRef, useEffect } from "react";
import { HeroSection } from "./HeroSection";
import { CoupleSection } from "./CoupleSection";
import { EventSection } from "./EventSection";
import { RSVPSection, RSVPPlaceholder } from "./RSVPSection";
import { WishesSection } from "./WishesSection";
import { GallerySection } from "./GallerySection";
import { GiftSection } from "./GiftSection";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventLabel } from "../../sections/BarcodeSection";
import type { Rsvp } from "@/types/prisma.types";

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
    } | null;
  };
  token: string | null;
}

const INVITATION_LABEL: Record<string, string> = {
  WEDDING: "The Wedding Of",
  SANGJIT: "Sangjit Ceremony Of",
  LAMARAN: "Lamaran",
};

export function ClassicTemplate({ guest, client, token }: Props) {
  const [opened, setOpened] = useState(false);
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const profile = client.weddingProfile;
  const theme = client.theme;

  const music = client.musics[0];

  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const primaryColor = theme?.primaryColor || "#b8860b";
  const secondaryColor = theme?.secondaryColor || "#faf6ee";
  const bgColor = theme?.bgColor || "#fffdf7";
  const textColor = theme?.textColor || "#3d3d3d";
  const fontHeading = theme?.fontHeading || "Playfair Display";

  const showCountdown = !!client.theme?.showCountdown;
  const showMap = client.theme?.showMap !== false;
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const coverImage = client.galleries.find((g) => g.type === "COVER");
  const bgImage = client.galleries.find((g) => g.type === "BACKGROUND");
  const invitationLabel = INVITATION_LABEL[client.clientType] || "The Wedding Of";


  const playMusicRef = useRef<(() => void) | null>(null);

  function handleOpen() {
    setOpened(true);
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

      {/* Cover / Pembuka */}
      {!opened && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
          style={{
            backgroundColor: bgColor,
            backgroundImage: coverImage ? `url('${coverImage.url}')` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {coverImage && <div className="absolute inset-0 bg-black/30" />}
          <div className="relative z-10 flex flex-col items-center">
            <p className={`text-sm tracking-widest uppercase mb-4 ${coverImage ? "text-white/80" : "text-stone-500"}`}>
              {invitationLabel}
            </p>
            <h1 className={`font-heading text-5xl mb-2 ${coverImage ? "text-white drop-shadow-lg" : "text-stone-800"}`}>
              {profile?.groomNickname || "Groom"}
            </h1>
            <p className={`text-2xl mb-2 ${coverImage ? "text-white/80" : "text-stone-500"}`}>&</p>
            <h1 className={`font-heading text-5xl mb-6 ${coverImage ? "text-white drop-shadow-lg" : "text-stone-800"}`}>
              {profile?.brideNickname || "Bride"}
            </h1>

            {guest && (
              <div className={`mb-6 ${coverImage ? "text-white/90" : "text-stone-600"}`}>
                <p className="text-xs tracking-wider uppercase mb-1">Kepada Yth.</p>
                <p className="text-xl font-medium">{guest.name}</p>
              </div>
            )}

            <button
              onClick={handleOpen}
              className={`px-8 py-3 rounded-full text-sm tracking-wider transition-colors ${
                coverImage
                  ? "bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30"
                  : "bg-stone-800 text-white hover:bg-stone-700"
              }`}
            >
              Buka Undangan
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={`min-h-screen transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={
          bgImage
            ? {
                backgroundImage: `url('${bgImage.url}')`,
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Overlay when bg image is set */}
        {bgImage && opened && (
          <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: `${bgColor}cc`, zIndex: 0 }} />
        )}

        <div className="relative z-10">
          {sectionKeys.includes("HERO") && <HeroSection profile={profile} />}

          {/* ── Countdown ── */}
          {showCountdown && countdownTimeLeft && (
            <section className="py-12 text-center" style={{ background: secondaryColor }}>
              <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: primaryColor }}>
                Menuju Hari Bahagia
              </p>
              <div className="flex justify-center gap-6">
                {[{ v: countdownTimeLeft.days, l: "Hari" }, { v: countdownTimeLeft.hours, l: "Jam" }, { v: countdownTimeLeft.minutes, l: "Menit" }, { v: countdownTimeLeft.seconds, l: "Detik" }].map(({ v, l }) => (
                  <div key={l} className="text-center min-w-12">
                    <div className="font-light" style={{ fontFamily: `'${fontHeading}', Georgia, serif`, fontSize: "2.4rem", color: primaryColor, lineHeight: 1 }}>
                      {String(v).padStart(2, "0")}
                    </div>
                    <div className="text-xs tracking-[0.16em] uppercase mt-1" style={{ color: textColor, opacity: 0.45 }}>{l}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sectionKeys.includes("COUPLE") && <CoupleSection profile={profile} />}
          {sectionKeys.includes("EVENT") && <EventSection events={client.events} showMap={showMap} />}
          {sectionKeys.includes("GALLERY") && <GallerySection galleries={client.galleries} />}

          {sectionKeys.includes("RSVP") && (
            token && guest
              ? <RSVPSection clientId={client.id} guest={guest} token={token} onConfirmed={setConfirmedRsvpStatus} />
              : <RSVPPlaceholder />
          )}

          {guest?.barcodeChurch && confirmedRsvpStatus === "HADIR" && (
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
          )}

          {sectionKeys.includes("WISHES") && (
            <WishesSection
              clientId={client.id}
              initialWishes={client.wishes}
              guestName={guest?.name}
              guestId={guest?.id}
            />
          )}

          {sectionKeys.includes("GIFT") && (
            <GiftSection gifts={client.gifts} />
          )}

          <footer className="py-10 text-center text-stone-400 text-xs">
            <p className="font-heading text-2xl text-stone-700 mb-2">
              {profile?.groomNickname} & {profile?.brideNickname}
            </p>
            <p>Terima kasih atas doa dan kehadirannya</p>
            <p className="mt-4 opacity-50">Made with Mengundang</p>
          </footer>
        </div>
      </div>
    </>
  );
}
