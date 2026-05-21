import { getEvents } from "@/modules/wedding/wedding.service";
import { EventsManager } from "@/components/cms/client/EventsManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function EventsPage({ params }: Props) {
  const { clientId } = await params;
  const events = await getEvents(clientId);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">
        Detail Acara
      </h2>
      <EventsManager clientId={clientId} initialEvents={events} />
    </div>
  );
}
