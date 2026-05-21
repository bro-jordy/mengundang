import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import {
  createGuestSchema,
  importGuestsSchema,
} from "@/modules/guests/guests.schema";
import {
  getGuests,
  createGuest,
  importGuests,
  deleteGuest,
} from "@/modules/guests/guests.service";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const guests = await getGuests(clientId);
    return apiSuccess(guests);
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

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { slug: true },
    });
    if (!client) return apiError("Client tidak ditemukan", 404);

    // bulk import
    if (Array.isArray(body)) {
      const parsed = importGuestsSchema.safeParse(body);
      if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");
      const result = await importGuests(clientId, parsed.data, client.slug);
      return apiSuccess({ count: result.count }, 201);
    }

    // single guest
    const parsed = createGuestSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const guest = await createGuest(clientId, parsed.data, client.slug);
    return apiSuccess(guest, 201);
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
    if (!id) return apiError("ID tamu diperlukan");

    await deleteGuest(id);
    return apiSuccess({ message: "Tamu dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
