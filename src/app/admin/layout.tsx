import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/cms/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string };

  return (
    <AdminShell role={user.role} user={session.user}>
      {children}
    </AdminShell>
  );
}
