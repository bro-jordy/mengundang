import { auth } from "@/lib/auth/auth";
import { canAccessClient } from "@/lib/auth/permissions";
import { getClientById } from "@/modules/clients/clients.service";
import { notFound, redirect } from "next/navigation";
import { ClientNav } from "@/components/cms/client/ClientNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}

export default async function ClientLayout({ children, params }: Props) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) redirect("/admin/clients");

  const client = await getClientById(clientId);
  if (!client) notFound();

  const user = session.user as { role?: string };
  const isSuperAdmin = user.role === "SUPERADMIN";

  return (
    <div className={`w-full mx-auto ${isSuperAdmin ? "max-w-5xl" : "max-w-7xl"}`}>
      <ClientNav client={client} role={user.role} />
      <div className="mt-4 md:mt-6">{children}</div>
    </div>
  );
}
