import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { getAttendances, getAttendanceStats, updateAttendanceActualPax } from "@/modules/attendance/attendance.service";
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

    const [attendances, stats] = await Promise.all([
      getAttendances(clientId),
      getAttendanceStats(clientId),
    ]);

    return apiSuccess({ attendances, stats });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { attendanceId, actualPax } = await req.json();
    if (!attendanceId || typeof actualPax !== "number") {
      return apiError("Data tidak valid");
    }

    const attendance = await updateAttendanceActualPax(attendanceId, actualPax);
    return apiSuccess(attendance);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
