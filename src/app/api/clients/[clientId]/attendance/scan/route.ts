import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { scanBarcode } from "@/modules/attendance/attendance.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { barcode } = await req.json();
    if (!barcode || typeof barcode !== "string") {
      return apiError("Barcode tidak valid");
    }

    const result = await scanBarcode(clientId, barcode);

    if (!result.success && "alreadyCheckedIn" in result && result.alreadyCheckedIn) {
      return apiSuccess(result, 200);
    }

    if (!result.success) {
      return apiError(result.error, 404);
    }

    return apiSuccess(result, 201);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
