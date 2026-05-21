import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const themeSchema = z.object({
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  bgColor: z.string().min(1),
  textColor: z.string().min(1),
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
  customCss: z.string().optional(),
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

    const theme = await prisma.theme.findUnique({ where: { clientId } });
    return apiSuccess(theme);
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
    const parsed = themeSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const theme = await prisma.theme.upsert({
      where: { clientId },
      update: parsed.data,
      create: { clientId, ...parsed.data },
    });
    return apiSuccess(theme);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
