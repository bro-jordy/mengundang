import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPERADMIN", "ADMIN", "STAFF"]).default("ADMIN"),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { clientUsers: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(users);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return apiError("Email sudah digunakan");

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, password: hashed, role: parsed.data.role as any },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return apiSuccess(user, 201);
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return apiError("Akses ditolak", 403);
    return apiError("Terjadi kesalahan server", 500);
  }
}
