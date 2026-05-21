import { requireAuth } from "@/lib/auth/permissions";
import { toggleWishApproval } from "@/modules/rsvp/rsvp.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const { isApproved } = await req.json();
    const wish = await toggleWishApproval(id, isApproved);
    return apiSuccess(wish);
  } catch {
    return apiError("Unauthorized", 401);
  }
}
