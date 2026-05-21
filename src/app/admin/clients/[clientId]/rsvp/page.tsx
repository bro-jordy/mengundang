import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { RsvpManager } from "@/components/cms/client/RsvpManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function RsvpPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const guests = await prisma.guest.findMany({
    where: { clientId, isActive: true },
    include: { rsvp: true },
    orderBy: { name: "asc" },
  });

  const guestList = guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    maxPax: g.maxPax,
    rsvpStatus: g.rsvpStatus as "HADIR" | "TIDAK_HADIR" | "PENDING",
    rsvp: g.rsvp
      ? {
          status: g.rsvp.status as "HADIR" | "TIDAK_HADIR" | "PENDING",
          paxCount: g.rsvp.paxCount,
          message: g.rsvp.message,
          createdAt: g.rsvp.createdAt,
        }
      : null,
  }));

  return <RsvpManager clientId={clientId} initialGuests={guestList} />;
}
