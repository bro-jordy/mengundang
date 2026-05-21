import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const rsvpAdminSchema = z.object({
  guestId: z.string().min(1),
  status: z.enum(["HADIR", "TIDAK_HADIR", "PENDING"]),
  paxCount: z.number().int().min(1).default(1),
  message: z.string().optional(),
});

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = rsvpAdminSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const { guestId, status, paxCount, message } = parsed.data;

    const guest = await prisma.guest.findUnique({
      where: { id: guestId, clientId },
      select: { id: true, name: true },
    });
    if (!guest) return apiError("Tamu tidak ditemukan", 404);

    const rsvp = await prisma.rsvp.upsert({
      where: { guestId },
      update: { status, paxCount, message: message || null },
      create: {
        guestId,
        clientId,
        name: guest.name,
        status,
        paxCount,
        message: message || null,
      },
    });

    await prisma.guest.update({
      where: { id: guestId },
      data: { rsvpStatus: status },
    });

    return apiSuccess(rsvp);
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

    const { guestId } = await req.json();
    if (!guestId) return apiError("guestId diperlukan");

    await prisma.rsvp.deleteMany({ where: { guestId, clientId } });
    await prisma.guest.update({
      where: { id: guestId, clientId },
      data: { rsvpStatus: "PENDING" },
    });

    return apiSuccess({ message: "RSVP dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
