import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { WhatsAppBlast } from "@/components/cms/client/WhatsAppBlast";
import { DEFAULT_TEMPLATE } from "@/lib/whatsapp";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function WhatsAppPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const [client, guests] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        weddingProfile: true,
        events: { orderBy: { sortOrder: "asc" }, take: 1 },
        whatsappTemplate: true,
      },
    }),
    prisma.guest.findMany({
      where: { clientId, isActive: true },
      include: { rsvp: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!client) notFound();

  const guestList = guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    maxPax: g.maxPax,
    sendStatus: g.sendStatus as "UNSENT" | "SENT",
    rsvpStatus: (g.rsvp?.status ?? g.rsvpStatus) as
      | "PENDING"
      | "HADIR"
      | "TIDAK_HADIR",
    invitationUrl: g.invitationUrl,
  }));

  return (
    <WhatsAppBlast
      clientId={clientId}
      clientName={client.name}
      initialGuests={guestList}
      initialTemplate={client.whatsappTemplate?.bodyTemplate ?? DEFAULT_TEMPLATE}
      initialTemplateEn={client.whatsappTemplate?.bodyTemplateEn ?? ""}
      profile={
        client.weddingProfile
          ? {
              groomName: client.weddingProfile.groomName,
              brideName: client.weddingProfile.brideName,
            }
          : null
      }
      firstEventDate={client.events[0]?.date ?? null}
    />
  );
}
