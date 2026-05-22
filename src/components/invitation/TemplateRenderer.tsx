import { DarkTemplate } from "./templates/dark";
import type { Rsvp } from "@/types/prisma.types";

interface Guest { id: string; name: string; maxPax: number; rsvp: Rsvp | null }

type InvitationClient = {
  id: string; name: string; slug: string; clientType: string;
  weddingProfile: {
    groomName: string; brideName: string; groomNickname: string; brideNickname: string;
    groomParents: string; brideParents: string;
    openingQuote: string | null; openingQuoteBy: string | null;
    story: string | null; heroImage: string | null;
    groomPhoto: string | null; bridePhoto: string | null;
  } | null;
  events: { id: string; type: string; label: string; date: Date | null; timeStart: string; timeEnd: string; venueName: string; venueAddress: string; mapsUrl: string }[];
  musics: { url: string; title: string }[];
  sections: { sectionKey: string; sortOrder: number }[];
  galleries: { id: string; url: string; type: string; sortOrder: number }[];
  gifts: { id: string; bankName: string | null; accountNumber: string | null; accountName: string | null; ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean }[];
  wishes: { id: string; name: string; message: string; createdAt: Date }[];
  theme: { templateSlug?: string | null; primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string } | null;
};

interface Props {
  guest: Guest | null;
  client: InvitationClient;
  token: string | null;
}

export function TemplateRenderer({ guest, client, token }: Props) {
  return <DarkTemplate guest={guest} client={client as any} token={token} />;
}
