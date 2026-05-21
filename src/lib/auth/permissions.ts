import { UserRole } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "@/lib/database/prisma";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  const user = session.user as { role: string };
  if (user.role !== UserRole.SUPERADMIN) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function canAccessClient(clientId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  const user = session.user as { id: string; role: string };

  if (user.role === UserRole.SUPERADMIN) return true;

  const access = await prisma.clientUser.findUnique({
    where: {
      userId_clientId: {
        userId: user.id,
        clientId,
      },
    },
  });

  return !!access;
}
