import { requireAuth, canAccessClient } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { DEFAULT_SECTIONS, SECTION_LABELS } from "@/constants/sections";
import type { SectionKey } from "@/types/prisma.types";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { clientId } = await params;
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const existing = await prisma.section.findMany({ where: { clientId }, orderBy: { sortOrder: "asc" } });
    const existingKeys = new Set(existing.map((s) => s.sectionKey));

    // Fill in any missing sections with defaults so new sections show up in CMS
    const defaults = DEFAULT_SECTIONS.filter((d) => !existingKeys.has(d.sectionKey));
    if (defaults.length > 0) {
      await prisma.section.createMany({
        data: defaults.map((d) => ({ ...d, clientId })),
        skipDuplicates: true,
      });
      const all = await prisma.section.findMany({ where: { clientId }, orderBy: { sortOrder: "asc" } });
      return apiSuccess(all.map((s) => ({ ...s, label: SECTION_LABELS[s.sectionKey as SectionKey] ?? s.sectionKey })));
    }

    return apiSuccess(existing.map((s) => ({ ...s, label: SECTION_LABELS[s.sectionKey as SectionKey] ?? s.sectionKey })));
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { clientId } = await params;
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { sectionKey, isActive } = await req.json();
    if (!sectionKey || typeof isActive !== "boolean") return apiError("Data tidak valid");

    const section = await prisma.section.upsert({
      where: { clientId_sectionKey: { clientId, sectionKey } },
      update: { isActive },
      create: { clientId, sectionKey, isActive, sortOrder: 0 },
    });

    return apiSuccess(section);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
