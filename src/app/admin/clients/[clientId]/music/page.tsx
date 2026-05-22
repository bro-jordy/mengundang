import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { MusicManager } from "@/components/cms/client/MusicManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function MusicPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const musics = await prisma.music.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, url: true, isActive: true },
  });

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Musik Undangan</h2>
      <MusicManager clientId={clientId} initialMusics={musics} />
    </div>
  );
}
