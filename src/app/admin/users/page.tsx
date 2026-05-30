import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { UsersManager } from "@/components/cms/UsersManager";

export default async function UsersPage() {
  const session = await auth();
  const user = session!.user as { id: string; role: string };

  if (user.role !== "SUPERADMIN") redirect("/admin/clients");

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { clientUsers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-800">Pengguna</h1>
        <p className="text-stone-500 text-sm mt-1">
          Kelola akun yang bisa mengakses CMS. Admin hanya bisa akses client yang ditetapkan.
        </p>
      </div>
      <UsersManager currentUserId={user.id} initialUsers={users} />
    </div>
  );
}
