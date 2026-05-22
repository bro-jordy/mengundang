import { prisma } from "@/lib/database/prisma";
import { getEvents } from "@/modules/wedding/wedding.service";
import { EventsManager } from "@/components/cms/client/EventsManager";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function EventsPage({ params }: Props) {
  const { clientId } = await params;

  const [client, events] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { clientType: true } }),
    getEvents(clientId),
  ]);

  if (!client) notFound();

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Detail Acara</h2>
      <EventsManager
        clientId={clientId}
        clientType={client.clientType}
        initialEvents={events}
      />
    </div>
  );
}
