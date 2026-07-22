import { requireAuth } from "@/lib/auth/permissions";
import { updateWish, deleteWish } from "@/modules/rsvp/rsvp.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data: { isApproved?: boolean; reply?: string | null } = {};
    if (body.isApproved !== undefined) data.isApproved = body.isApproved;
    if ("reply" in body) data.reply = body.reply ?? null;
    const wish = await updateWish(id, data);
    return apiSuccess(wish);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    await deleteWish(id);
    return apiSuccess({ id });
  } catch {
    return apiError("Unauthorized", 401);
  }
}
