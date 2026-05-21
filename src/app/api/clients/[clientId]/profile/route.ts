import { canAccessClient } from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/permissions";
import { weddingProfileSchema } from "@/modules/wedding/wedding.schema";
import { upsertWeddingProfile, getWeddingProfile } from "@/modules/wedding/wedding.service";
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

    const profile = await getWeddingProfile(clientId);
    return apiSuccess(profile);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = weddingProfileSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const profile = await upsertWeddingProfile(clientId, parsed.data);
    return apiSuccess(profile);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
