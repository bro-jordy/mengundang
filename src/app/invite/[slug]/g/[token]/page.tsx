import { getGuestByToken, markGuestOpened } from "@/modules/guests/guests.service";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/utils";
import { ClassicTemplate } from "@/components/invitation/templates/classic";

interface Props {
  params: Promise<{ slug: string; token: string }>;
}

export default async function GuestInvitationPage({ params }: Props) {
  const { token } = await params;

  const guest = await getGuestByToken(token);
  if (!guest || !guest.isActive) notFound();
  if (guest.client.status !== "ACTIVE") notFound();

  // Track visit
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "";
  const ua = headersList.get("user-agent") || "";
  markGuestOpened(guest.id, ip, ua, getDeviceType(ua)).catch(() => {});

  return (
    <ClassicTemplate
      guest={{ id: guest.id, name: guest.name, maxPax: guest.maxPax, rsvp: guest.rsvp }}
      client={guest.client}
      token={token}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) return {};

  const profile = guest.client.weddingProfile;
  const title = profile
    ? `Undangan Pernikahan ${profile.groomName} & ${profile.brideName}`
    : `Undangan Pernikahan - ${guest.client.name}`;

  return {
    title,
    description: `Anda diundang ke acara pernikahan ${guest.client.name}`,
  };
}
