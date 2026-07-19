"use client";

import dynamic from "next/dynamic";
import type { Rsvp } from "@/types/prisma.types";

// Tema lain (classic, dark, envelope, hanoi-modern, lucky-hanoi, lucky-jackpot, pearl) masih ada
// di src/components/invitation/templates/ untuk testing, tapi sengaja tidak didaftarkan di sini
// biar tidak ikut ke-bundle ke JS undangan tamu. Tema aktif saat ini: sage & lucky-envelope.
const SageTemplate = dynamic(() => import("./templates/sage").then((m) => m.SageTemplate));
const LuckyEnvelopeTemplate = dynamic(() =>
  import("./templates/lucky-envelope").then((m) => m.LuckyEnvelopeTemplate)
);

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: "GEREJA_SAJA" | "GEREJA_RESEPSI";
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

type InvitationClient = {
  id: string; name: string; slug: string; clientType: string;
  weddingProfile: {
    groomName: string; brideName: string; groomNickname: string; brideNickname: string;
    groomParents: string; brideParents: string;
    openingQuote: string | null; openingQuoteBy: string | null;
    story: string | null; storyTitle: string | null; showStoryTitle: boolean;
    heroImage: string | null;
    groomPhoto: string | null; bridePhoto: string | null;
    showGroomPhoto: boolean; showBridePhoto: boolean;
  } | null;
  events: { id: string; type: string; label: string; date: Date | null; timeStart: string; timeEnd: string; venueName: string; venueNameEn?: string | null; venueAddress: string; mapsUrl: string }[];
  musics: { url: string; title: string }[];
  sections: { sectionKey: string; sortOrder: number }[];
  galleries: { id: string; url: string; type: string; sortOrder: number }[];
  gifts: { id: string; bankName: string | null; accountNumber: string | null; accountName: string | null; ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean }[];
  wishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  theme: { templateSlug?: string | null; primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null; showMap?: boolean | null } | null;
};

interface Props {
  guest: Guest | null;
  client: InvitationClient;
  token: string | null;
}

export function TemplateRenderer({ guest, client, token }: Props) {
  const slug = client.theme?.templateSlug || "sage";

  if (slug === "lucky-envelope") return <LuckyEnvelopeTemplate guest={guest} client={client as any} token={token} />;
  return <SageTemplate guest={guest} client={client as any} token={token} />;
}
