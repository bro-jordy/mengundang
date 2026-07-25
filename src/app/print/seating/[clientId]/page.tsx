import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { getSeatingExport } from "@/modules/tables/tables.service";
import { formatDate } from "@/lib/utils";
import { SOUP_LABEL } from "@/lib/soup";
import { PrintButton } from "./PrintButton";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function SeatingPrintPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const [client, exportData] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        weddingProfile: true,
        events: { where: { type: { in: ["RESEPSI", "AFTER_PARTY"] } }, orderBy: { sortOrder: "asc" } },
      },
    }),
    getSeatingExport(clientId),
  ]);

  if (!client) notFound();

  const receptionEvent = client.events[0];
  const coupleName = client.weddingProfile
    ? `${client.weddingProfile.groomNickname || client.weddingProfile.groomName} & ${client.weddingProfile.brideNickname || client.weddingProfile.brideName}`
    : client.name;

  const sections = [...new Set(exportData.tables.map((t) => t.sectionLabel))];
  const totalPax =
    exportData.tables.reduce((sum, t) => sum + t.guests.reduce((s, g) => s + g.pax, 0), 0) +
    exportData.unassignedGuests.reduce((s, g) => s + g.pax, 0);
  const soupTotal = Object.values(exportData.soupTotals).reduce((s, n) => s + n, 0);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem", color: "#1c1917" }}>
      <PrintButton />

      <div style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px solid #1c1917", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Seating &amp; Menu Resepsi</h1>
        <p style={{ fontSize: "1rem", margin: "0.3rem 0 0" }}>{coupleName}</p>
        {receptionEvent && (
          <p style={{ fontSize: "0.85rem", color: "#57534e", margin: "0.2rem 0 0" }}>
            {receptionEvent.venueName || receptionEvent.label} · {formatDate(receptionEvent.date)}
          </p>
        )}
        <p style={{ fontSize: "0.8rem", color: "#78716c", margin: "0.4rem 0 0" }}>Total {totalPax} pax</p>
      </div>

      {sections.map((section) => {
        const sectionTables = exportData.tables.filter((t) => t.sectionLabel === section);
        const sectionPax = sectionTables.reduce((s, t) => s + t.guests.reduce((x, g) => x + g.pax, 0), 0);
        const sectionCapacity = sectionTables.reduce((s, t) => s + t.capacity, 0);

        return (
          <div key={section} style={{ marginBottom: "1.75rem", breakInside: "avoid" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid #d6d3d1", paddingBottom: "0.4rem", marginBottom: "0.75rem" }}>
              {section} <span style={{ fontWeight: 400, color: "#78716c", fontSize: "0.85rem" }}>({sectionPax}/{sectionCapacity} pax)</span>
            </h2>
            {sectionTables.map((t) => {
              const tablePax = t.guests.reduce((s, g) => s + g.pax, 0);
              return (
                <div key={t.id} style={{ marginBottom: "0.9rem", breakInside: "avoid", paddingLeft: "0.6rem", borderLeft: "3px solid #e7e5e4" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.3rem" }}>
                    {t.code} <span style={{ fontWeight: 400, color: "#78716c" }}>({tablePax}/{t.capacity} pax)</span>
                  </p>
                  {t.guests.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "#a8a29e", fontStyle: "italic", margin: 0 }}>Kosong</p>
                  ) : (
                    t.guests.map((g) => (
                      <div key={g.id} style={{ marginBottom: "0.4rem" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: "0 0 0.15rem" }}>{g.name} — {g.pax} pax</p>
                        <ol style={{ margin: 0, paddingLeft: "1.3rem", fontSize: "0.8rem", color: "#44403c" }}>
                          {Array.from({ length: g.pax }, (_, i) => (
                            <li key={i}>{g.soupChoices[i] ? SOUP_LABEL[g.soupChoices[i]] ?? g.soupChoices[i] : "belum pilih soup"}</li>
                          ))}
                        </ol>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {exportData.unassignedGuests.length > 0 && (
        <div
          style={{
            marginBottom: "1.75rem",
            breakInside: "avoid",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem", color: "#92400e" }}>
            ⚠️ Belum Ditempatkan ({exportData.unassignedGuests.reduce((s, g) => s + g.pax, 0)} pax)
          </h2>
          {exportData.unassignedGuests.map((g) => (
            <div key={g.id} style={{ marginBottom: "0.4rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: "0 0 0.15rem" }}>{g.name} — {g.pax} pax</p>
              <ol style={{ margin: 0, paddingLeft: "1.3rem", fontSize: "0.8rem", color: "#44403c" }}>
                {Array.from({ length: g.pax }, (_, i) => (
                  <li key={i}>{g.soupChoices[i] ? SOUP_LABEL[g.soupChoices[i]] ?? g.soupChoices[i] : "belum pilih soup"}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "2rem", borderTop: "2px solid #1c1917", paddingTop: "1rem", breakInside: "avoid" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.6rem" }}>Rekap Total Soup</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <tbody>
            {Object.entries(SOUP_LABEL).map(([key, label]) => (
              <tr key={key} style={{ borderBottom: "1px solid #e7e5e4" }}>
                <td style={{ padding: "0.4rem 0" }}>{label}</td>
                <td style={{ padding: "0.4rem 0", textAlign: "right", fontWeight: 600 }}>{exportData.soupTotals[key] ?? 0}</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: "0.5rem 0", fontWeight: 700 }}>Total</td>
              <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>{soupTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
