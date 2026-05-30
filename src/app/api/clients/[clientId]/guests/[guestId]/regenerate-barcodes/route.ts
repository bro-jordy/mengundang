import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { regenerateGuestBarcodes } from "@/modules/guests/guests.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string; guestId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { clientId, guestId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const guest = await regenerateGuestBarcodes(guestId);
    return apiSuccess(guest);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
