import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const musicSchema = z.object({
  title: z.string().min(1, "Judul lagu diperlukan"),
  url: z.string().min(1, "URL lagu diperlukan"),
});

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const musics = await prisma.music.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
    });
    return apiSuccess(musics);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = musicSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    // Deactivate all existing musics first (only one active at a time)
    await prisma.music.updateMany({ where: { clientId }, data: { isActive: false } });

    const music = await prisma.music.create({
      data: { clientId, title: parsed.data.title, url: parsed.data.url, isActive: true },
    });
    return apiSuccess(music, 201);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { id, isActive } = await req.json();
    if (!id) return apiError("ID musik diperlukan");

    if (isActive) {
      // Only one can be active — deactivate all others first
      await prisma.music.updateMany({ where: { clientId }, data: { isActive: false } });
    }

    const music = await prisma.music.update({
      where: { id, clientId },
      data: { isActive },
    });
    return apiSuccess(music);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { id } = await req.json();
    if (!id) return apiError("ID musik diperlukan");

    await prisma.music.delete({ where: { id, clientId } });
    return apiSuccess({ message: "Musik dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
