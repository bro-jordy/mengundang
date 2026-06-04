import { getGuestByToken, markGuestOpened } from "@/modules/guests/guests.service";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/utils";
import { TemplateRenderer } from "@/components/invitation/TemplateRenderer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; token: string }>;
}

export default async function GuestInvitationPage({ params }: Props) {
  const { token } = await params;

  const guest = await getGuestByToken(token);
  if (!guest || !guest.isActive) notFound();
  if (guest.client.status !== "ACTIVE") notFound();

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "";
  const ua = headersList.get("user-agent") || "";
  markGuestOpened(guest.id, ip, ua, getDeviceType(ua)).catch(() => {});

  return (
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
  );
}

function getEventLabel(clientType: string): string {
  if (clientType === "SANGJIT") return "Sangjit";
  if (clientType === "LAMARAN") return "Lamaran";
  return "Pernikahan";
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) return {};

  const profile = guest.client.weddingProfile;
  const eventLabel = getEventLabel(guest.client.clientType);
  const coupleNames = profile
    ? `${profile.groomName} & ${profile.brideName}`
    : guest.client.name;

  return {
    title: `Undangan ${eventLabel} ${coupleNames}`,
    description: `Anda diundang ke acara ${eventLabel.toLowerCase()} ${coupleNames}`,
  };
}
