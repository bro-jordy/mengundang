import { getWishes, toggleWishApproval } from "@/modules/rsvp/rsvp.service";
import { formatDate } from "@/lib/utils";
import { WishesAdmin } from "@/components/cms/client/WishesAdmin";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function WishesPage({ params }: Props) {
  const { clientId } = await params;
  const wishes = await getWishes(clientId);

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">
        Ucapan & Doa ({wishes.length})
      </h2>
      <WishesAdmin clientId={clientId} initialWishes={wishes} />
    </div>
  );
}
