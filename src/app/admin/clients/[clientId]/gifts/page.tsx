import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { GiftsManager } from "@/components/cms/client/GiftsManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function GiftsPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const gifts = await prisma.gift.findMany({
    where: { clientId },
    orderBy: { sortOrder: "asc" },
  });

  return <GiftsManager clientId={clientId} initialGifts={gifts} />;
}
