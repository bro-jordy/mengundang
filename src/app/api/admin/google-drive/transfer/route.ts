import { requireAuth, canAccessClient } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { getAuthorizedDriveClient, uploadBufferToDrive } from "@/lib/googleDrive";
import { apiError, apiSuccess } from "@/lib/utils";

function extractFolderId(input: string): string {
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.trim();
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const clientId: string | undefined = body.clientId;
    const photoIds: string[] = Array.isArray(body.photoIds) ? body.photoIds : [];
    const folderInput: string | undefined = body.folderId;

    if (!clientId || !folderInput || photoIds.length === 0) {
      return apiError("clientId, folderId, dan photoIds diperlukan");
    }
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const folderId = extractFolderId(folderInput);

    const photos = await prisma.guestPhoto.findMany({
      where: { id: { in: photoIds }, clientId },
      include: { guest: { select: { name: true } } },
    });

    const drive = await getAuthorizedDriveClient(userId);

    const results: { id: string; success: boolean; error?: string }[] = [];
    for (const photo of photos) {
      try {
        const res = await fetch(photo.url);
        if (!res.ok) throw new Error("Gagal mengambil file foto");
        const buffer = Buffer.from(await res.arrayBuffer());
        const guestName = photo.guest?.name?.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "tamu";
        const fileName = `${guestName}-${photo.id}.jpg`;

        await uploadBufferToDrive(drive, { name: fileName, mimeType: "image/jpeg", folderId, buffer });
        results.push({ id: photo.id, success: true });
      } catch (err) {
        results.push({ id: photo.id, success: false, error: err instanceof Error ? err.message : "Gagal upload" });
      }
    }

    return apiSuccess({ results });
  } catch (err) {
    if (err instanceof Error && err.message === "Google Drive belum terhubung") {
      return apiError(err.message, 400);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}
