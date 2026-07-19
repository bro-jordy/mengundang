import { getGuestByToken, markGuestOpened } from "@/modules/guests/guests.service";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/utils";
import { TemplateRenderer } from "@/components/invitation/TemplateRenderer";
import { DisposableCamera } from "@/components/invitation/sections/DisposableCamera";

export const dynamic = "force-dynamic";

const THEME_FONTS: Record<string, string> = {
  envelope:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap",
  pearl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,300&display=swap",
  dark: "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap",
  sage: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,300&display=swap",
  "lucky-jackpot":
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap",
  "lucky-envelope":
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function GuestInvitationByTokenPage({ params }: Props) {
  const { token } = await params;

  const guest = await getGuestByToken(token);
  if (!guest || !guest.isActive) notFound();
  if (guest.client.status !== "ACTIVE") notFound();

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "";
  const ua = headersList.get("user-agent") || "";
  markGuestOpened(guest.id, guest.client.id, ip, ua, getDeviceType(ua)).catch(() => {});

  const fontUrl = THEME_FONTS[guest.client.theme?.templateSlug ?? ""] ?? null;

  return (
    <>
      {fontUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={fontUrl} rel="stylesheet" />
        </>
      )}
      <TemplateRenderer
        guest={{
          id: guest.id,
          name: guest.name,
          maxPax: guest.maxPax,
          rsvp: guest.rsvp,
          invitationCategory: guest.invitationCategory as "GEREJA_SAJA" | "GEREJA_RESEPSI",
          barcodeChurch: guest.barcodeChurch,
          barcodeReception: guest.barcodeReception,
        }}
        client={guest.client as any}
        token={token}
      />
      <DisposableCamera
        token={token}
        clientId={guest.client.id}
        guestName={guest.name}
        rsvpStatus={guest.rsvp?.status ?? null}
        hasCheckedIn={guest.attendances.length > 0}
        eventDates={guest.client.events
          .filter((e) => e.date)
          .map((e) => new Date(e.date as Date).toISOString())}
      />
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) return {};

  const profile = guest.client.weddingProfile;
  const coupleNames = profile
    ? `${profile.groomName} & ${profile.brideName}`
    : guest.client.name;

  return {
    title: coupleNames,
    description: "",
    openGraph: {
      title: coupleNames,
      description: "",
    },
  };
}
