import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { eventSchema } from "@/modules/wedding/wedding.schema";
import { getEvents, upsertEvent, deleteEvent } from "@/modules/wedding/wedding.service";
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

    const events = await getEvents(clientId);
    return apiSuccess(events);
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
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const event = await upsertEvent(clientId, parsed.data, body.id);
    return apiSuccess(event);
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
    if (!id) return apiError("ID event diperlukan");

    await deleteEvent(id);
    return apiSuccess({ message: "Event dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
