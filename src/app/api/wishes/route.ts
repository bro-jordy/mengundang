import { wishSchema } from "@/modules/rsvp/rsvp.schema";
import { submitWish } from "@/modules/rsvp/rsvp.service";
import { apiError, apiSuccess } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = wishSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const wish = await submitWish(parsed.data);
    return apiSuccess(wish);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
