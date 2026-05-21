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
        events: { where: { type: "RESEPSI" }, take: 1 },
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
        client={client}
      />
    </div>
  );
}
