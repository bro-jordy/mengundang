import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { updateGuestSchema } from "@/modules/guests/guests.schema";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string; guestId: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clientId, guestId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { sendStatus } = await req.json();
    if (!sendStatus) return apiError("sendStatus diperlukan");

    const guest = await prisma.guest.update({
      where: { id: guestId, clientId },
      data: { sendStatus },
    });
    return apiSuccess(guest);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { clientId, guestId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = updateGuestSchema.safeParse(body);
    if (!parsed.success) return apiError("Data tidak valid");

    const guest = await prisma.guest.update({
      where: { id: guestId, clientId },
      data: parsed.data,
    });
    return apiSuccess(guest);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
