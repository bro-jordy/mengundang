import { requireAuth } from "@/lib/auth/permissions";
import { disconnectGoogleDrive } from "@/lib/googleDrive";
import { apiError, apiSuccess } from "@/lib/utils";

export async function POST() {
  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;
    await disconnectGoogleDrive(userId);
    return apiSuccess({ disconnected: true });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
