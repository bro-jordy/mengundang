import { requireSuperAdmin, getSession } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params { params: Promise<{ userId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    // Prevent deleting yourself
    const session = await getSession();
    const me = session!.user as { id: string };
    if (me.id === userId) return apiError("Tidak bisa menghapus akun sendiri");

    await prisma.user.delete({ where: { id: userId } });
    return apiSuccess({ message: "Pengguna dihapus" });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return apiError("Akses ditolak", 403);
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;
    const { role } = await req.json();
    if (!["SUPERADMIN", "ADMIN", "STAFF"].includes(role)) return apiError("Role tidak valid");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return apiSuccess(user);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
