import { auth } from "@/lib/auth/auth";
import { getAllClients } from "@/modules/clients/clients.service";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ClientStatusBadge } from "@/components/cms/client/ClientStatusBadge";
import { ClientTypeSelect } from "@/components/cms/client/ClientTypeSelect";
import { ExternalLink, Users } from "lucide-react";

const CLIENT_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  WEDDING:  { label: "Pernikahan", cls: "bg-rose-50 text-rose-700" },
  SANGJIT:  { label: "Sangjit",    cls: "bg-purple-50 text-purple-700" },
  LAMARAN:  { label: "Lamaran",    cls: "bg-blue-50 text-blue-700" },
};

export default async function ClientsPage() {
  const session = await auth();
  const user = session!.user as { id: string; role: string };
  const clients = await getAllClients(user.id, user.role);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Client</h1>
          <p className="text-stone-500 text-sm mt-1">{clients.length} client terdaftar</p>
        </div>
        <Link href="/admin/clients/new"
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition-colors">
          + Buat Client Baru
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">Belum ada client.</p>
          <Link href="/admin/clients/new" className="mt-3 inline-block text-stone-800 underline text-sm">
            Buat yang pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Nama Client</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Jenis Acara</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Slug / URL</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Tamu</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Dibuat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {clients.map((client) => {
                const typeInfo = CLIENT_TYPE_LABELS[(client as any).clientType] ?? { label: (client as any).clientType, cls: "bg-stone-100 text-stone-600" };
                return (
                  <tr key={client.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-stone-800">{client.name}</p>
                        {client.weddingProfile && (
                          <p className="text-stone-400 text-xs">
                            {client.weddingProfile.groomName && client.weddingProfile.brideName
                              ? `${client.weddingProfile.groomName} & ${client.weddingProfile.brideName}`
                              : "Profil belum diisi"}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ClientTypeSelect
                        clientId={client.id}
                        initialType={(client as any).clientType}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-stone-600 font-mono text-xs">/invite/{client.slug}</span>
                        {client.status === "ACTIVE" && (
                          <a href={`/invite/${client.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-stone-400 hover:text-stone-600">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-stone-600">
                        <Users size={12} />
                        {client._count.guests}
                      </div>
                    </td>
                    <td className="px-4 py-3"><ClientStatusBadge status={client.status} /></td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{formatDate(client.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${client.id}`}
                        className="text-stone-600 hover:text-stone-900 text-xs underline">
                        Kelola
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
