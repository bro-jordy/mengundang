"use client";

import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { CoupleSection } from "./CoupleSection";
import { EventSection } from "./EventSection";
import { RSVPSection } from "./RSVPSection";
import { WishesSection } from "./WishesSection";
import { GallerySection } from "./GallerySection";
import { GiftSection } from "./GiftSection";
import { MusicPlayer } from "../../sections/MusicPlayer";
import type { Rsvp } from "@/types/prisma.types";

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
}

interface Props {
  guest: Guest | null;
  client: {
    id: string;
    name: string;
    slug: string;
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
      heroImage: string | null;
      groomPhoto: string | null;
      bridePhoto: string | null;
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
      type: "HERO" | "COVER" | "PREWEDDING" | "GALLERY";
      sortOrder: number;
    }[];
    gifts: {
      id: string;
      bankName: string | null;
      accountNumber: string | null;
      accountName: string | null;
      ewalletType: string | null;
      ewalletNumber: string | null;
      isActive: boolean;
    }[];
    wishes: {
      id: string;
      name: string;
      message: string;
      createdAt: Date;
    }[];
    theme: {
      primaryColor: string;
      secondaryColor: string;
      bgColor: string;
      textColor: string;
      fontHeading: string;
      fontBody: string;
    } | null;
  };
  token: string | null;
}

export function ClassicTemplate({ guest, client, token }: Props) {
  const [opened, setOpened] = useState(false);
  const profile = client.weddingProfile;
  const theme = client.theme;

  const music = client.musics[0];

  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const primaryColor = theme?.primaryColor || "#b8860b";
  const bgColor = theme?.bgColor || "#fffdf7";

  return (
    <>
      <style>{`
        :root {
          --primary: ${primaryColor};
          --bg: ${bgColor};
          --text: ${theme?.textColor || "#3d3d3d"};
        }
        body { background-color: var(--bg); color: var(--text); }
        .font-heading { font-family: '${theme?.fontHeading || "Playfair Display"}', Georgia, serif; }
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .border-primary { border-color: var(--primary); }
      `}</style>

      {music && <MusicPlayer url={music.url} title={music.title} />}

      {/* Cover / Pembuka */}
      {!opened && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
          style={{ backgroundColor: bgColor, backgroundImage: "url('/cover-bg.jpg')" }}
        >
          <p className="text-sm tracking-widest uppercase text-stone-500 mb-4">
            Undangan Pernikahan
          </p>
          <h1 className="font-heading text-5xl text-stone-800 mb-2">
            {profile?.groomNickname || "Groom"}
          </h1>
          <p className="text-stone-500 text-2xl mb-2">&</p>
          <h1 className="font-heading text-5xl text-stone-800 mb-6">
            {profile?.brideNickname || "Bride"}
          </h1>

          {guest && (
            <div className="mb-6 text-stone-600">
              <p className="text-xs tracking-wider uppercase mb-1">Kepada Yth.</p>
              <p className="text-xl font-medium">{guest.name}</p>
            </div>
          )}

          <button
            onClick={() => setOpened(true)}
            className="bg-stone-800 text-white px-8 py-3 rounded-full text-sm tracking-wider hover:bg-stone-700 transition-colors"
          >
            Buka Undangan
          </button>
        </div>
      )}

      {/* Main content */}
      <div className={`min-h-screen transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {sectionKeys.includes("HERO") && (
          <HeroSection profile={profile} />
        )}

        {sectionKeys.includes("COUPLE") && (
          <CoupleSection profile={profile} />
        )}

        {sectionKeys.includes("EVENT") && (
          <EventSection events={client.events} />
        )}

        {sectionKeys.includes("GALLERY") && (
          <GallerySection galleries={client.galleries} />
        )}

        {sectionKeys.includes("RSVP") && token && guest && (
          <RSVPSection
            clientId={client.id}
            guest={guest}
            token={token}
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

        {/* Footer */}
        <footer className="py-10 text-center text-stone-400 text-xs">
          <p className="font-heading text-2xl text-stone-700 mb-2">
            {profile?.groomNickname} & {profile?.brideNickname}
          </p>
          <p>Terima kasih atas doa dan kehadirannya</p>
          <p className="mt-4 opacity-50">Made with UdanganKami</p>
        </footer>
      </div>
    </>
  );
}
