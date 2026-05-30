import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { SectionsManager } from "@/components/cms/client/SectionsManager";
import { DEFAULT_SECTIONS, SECTION_LABELS } from "@/constants/sections";
import type { SectionKey } from "@/types/prisma.types";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function SectionsPage({ params }: Props) {
  const { clientId } = await params;
  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const [existing, theme] = await Promise.all([
    prisma.section.findMany({ where: { clientId }, orderBy: { sortOrder: "asc" } }),
    prisma.theme.findUnique({ where: { clientId }, select: { showCountdown: true } }),
  ]);

  const existingKeys = new Set(existing.map((s) => s.sectionKey));

  // Merge with defaults so all sections appear even if not yet in DB
  const allSections = [
    ...existing.map((s) => ({
      ...s,
      label: SECTION_LABELS[s.sectionKey as SectionKey] ?? s.sectionKey,
    })),
    ...DEFAULT_SECTIONS
      .filter((d) => !existingKeys.has(d.sectionKey))
      .map((d) => ({
        id: `default-${d.sectionKey}`,
        clientId,
        sectionKey: d.sectionKey as string,
        isActive: d.isActive,
        sortOrder: d.sortOrder,
        label: SECTION_LABELS[d.sectionKey] ?? d.sectionKey,
      })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-stone-800">Tampilan Section</h2>
        <p className="text-sm text-stone-500 mt-1">Atur section mana yang ditampilkan di undangan</p>
      </div>
      <SectionsManager
        clientId={clientId}
        initialSections={allSections}
        showCountdown={theme?.showCountdown ?? false}
      />
    </div>
  );
}
