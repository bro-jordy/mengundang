import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { redirect } from "next/navigation";
import { getAllClients } from "@/modules/clients/clients.service";
import Link from "next/link";
import { Heart, Users, CheckCircle } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  const user = session!.user as { id: string; role: string; name: string };

  // Non-SUPERADMIN → redirect to their first client
  if (user.role !== "SUPERADMIN") {
    const clients = await getAllClients(user.id, user.role);
    if (clients.length > 0) redirect(`/admin/clients/${clients[0].id}`);
    else redirect("/admin/clients");
  }

  const [totalClients, totalGuests, totalRsvp] = await Promise.all([
    prisma.client.count(),
    prisma.guest.count(),
    prisma.rsvp.count({ where: { status: "HADIR" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-800">
          Selamat datang, {user.name} 👋
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Kelola semua undangan wedding dari sini.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Client" value={totalClients} icon={Heart} />
        <StatCard label="Total Tamu" value={totalGuests} icon={Users} />
        <StatCard label="Konfirmasi Hadir" value={totalRsvp} icon={CheckCircle} />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Aksi Cepat</h2>
        <div className="flex gap-3">
          <Link
            href="/admin/clients/new"
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition-colors"
          >
            + Buat Client Baru
          </Link>
          <Link
            href="/admin/clients"
            className="border border-stone-300 text-stone-700 px-4 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors"
          >
            Lihat Semua Client
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-stone-500">{label}</p>
        <Icon size={16} className="text-stone-400" />
      </div>
      <p className="text-3xl font-bold text-stone-800">{value}</p>
    </div>
  );
}
