import { requireAuth } from "@/lib/auth/permissions";
import { canAccessClient } from "@/lib/auth/permissions";
import { updateClientSchema } from "@/modules/clients/clients.schema";
import {
  getClientById,
  updateClient,
  deleteClient,
  isSlugTaken,
} from "@/modules/clients/clients.service";
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

    const client = await getClientById(clientId);
    if (!client) return apiError("Client tidak ditemukan", 404);

    return apiSuccess(client);
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
    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    if (parsed.data.slug) {
      const taken = await isSlugTaken(parsed.data.slug, clientId);
      if (taken) return apiError("Slug sudah digunakan client lain");
    }

    const client = await updateClient(clientId, parsed.data);
    return apiSuccess(client);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    const session = await requireAuth();
    const user = session.user as { role: string };

    if (user.role !== "SUPERADMIN") return apiError("Akses ditolak", 403);

    await deleteClient(clientId);
    return apiSuccess({ message: "Client berhasil dihapus" });
  } catch {
    return apiError("Unauthorized", 401);
  }
}
