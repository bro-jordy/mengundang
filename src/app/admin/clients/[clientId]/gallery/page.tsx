import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { GalleryManager } from "@/components/cms/client/GalleryManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function GalleryPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const galleries = await prisma.gallery.findMany({
    where: { clientId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <GalleryManager
      clientId={clientId}
      initialGalleries={galleries}
    />
  );
}
