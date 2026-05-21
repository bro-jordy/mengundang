import { requireAuth } from "@/lib/auth/permissions";
import { createClientSchema } from "@/modules/clients/clients.schema";
import {
  getAllClients,
  createClient,
  isSlugTaken,
} from "@/modules/clients/clients.service";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = session.user as { id: string; role: string };
    const clients = await getAllClients(user.id, user.role);
    return apiSuccess(clients);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const user = session.user as { id: string; role: string };
    const body = await req.json();

    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Validasi gagal");
    }

    const slugTaken = await isSlugTaken(parsed.data.slug);
    if (slugTaken) {
      return apiError("Slug sudah digunakan client lain");
    }

    const client = await createClient(parsed.data, user.id);
    return apiSuccess(client, 201);
  } catch {
    return apiError("Unauthorized", 401);
  }
}
