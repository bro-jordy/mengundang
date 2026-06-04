import { getGuests } from "@/modules/guests/guests.service";
import { prisma } from "@/lib/database/prisma";
import { GuestsManager } from "@/components/cms/guests/GuestsManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function GuestsPage({ params }: Props) {
  const { clientId } = await params;

  const [guests, client] = await Promise.all([
    getGuests(clientId),
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        weddingProfile: true,
        events: { orderBy: { sortOrder: "asc" } },
        whatsappTemplate: true,
      },
    }),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">
        Manajemen Tamu
      </h2>
      <GuestsManager
        clientId={clientId}
        initialGuests={guests}
        client={client ? {
          name: client.name,
          slug: client.slug,
          clientType: client.clientType,
          weddingProfile: client.weddingProfile,
          events: client.events.map((e) => ({ date: e.date, type: e.type })),
          whatsappTemplate: client.whatsappTemplate,
        } : null}
      />
    </div>
  );
}
