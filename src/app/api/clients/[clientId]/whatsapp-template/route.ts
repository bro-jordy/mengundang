import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const templateSchema = z.object({
  bodyTemplate: z.string().min(1, "Template tidak boleh kosong"),
});

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const template = await prisma.whatsappTemplate.findUnique({ where: { clientId } });
    return apiSuccess(template);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const template = await prisma.whatsappTemplate.upsert({
      where: { clientId },
      update: { bodyTemplate: parsed.data.bodyTemplate },
      create: { clientId, bodyTemplate: parsed.data.bodyTemplate },
    });
    return apiSuccess(template);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
