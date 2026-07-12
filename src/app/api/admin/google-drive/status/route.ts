import { requireAuth } from "@/lib/auth/permissions";
import { getDriveAccount } from "@/lib/googleDrive";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;
    const account = await getDriveAccount(userId);
    return apiSuccess({ connected: !!account, email: account?.email ?? null });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
