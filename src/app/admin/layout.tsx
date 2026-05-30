import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/cms/layout/AdminSidebar";
import { AdminTopBar } from "@/components/cms/layout/AdminTopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      <AdminSidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
