import { prisma } from "@/lib/database/prisma";
import type { CreateTableInput, UpdateTableInput } from "./tables.schema";

export async function getTables(clientId: string) {
  return prisma.table.findMany({
    where: { clientId },
    include: { guests: { select: { id: true, name: true, maxPax: true } } },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
}

export async function getUnassignedReceptionGuests(clientId: string) {
  const guests = await prisma.guest.findMany({
    where: { clientId, isActive: true, tableId: null },
    select: { id: true, name: true, maxPax: true, invitationCategory: true },
    orderBy: { name: "asc" },
  });
  return guests.filter((g) => g.invitationCategory.includes("RESEPSI"));
}

export async function createTable(clientId: string, data: CreateTableInput) {
  return prisma.table.create({ data: { clientId, ...data } });
}

export async function updateTable(clientId: string, data: UpdateTableInput) {
  const { id, ...rest } = data;
  return prisma.table.update({ where: { id, clientId }, data: rest });
}

export async function deleteTable(clientId: string, id: string) {
  return prisma.table.delete({ where: { id, clientId } });
}

export async function assignGuestToTable(clientId: string, guestId: string, tableId: string | null) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId, clientId },
    select: { maxPax: true },
  });
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  if (tableId) {
    const table = await prisma.table.findUnique({
      where: { id: tableId, clientId },
      include: { guests: { select: { id: true, maxPax: true } } },
    });
    if (!table) throw new Error("TABLE_NOT_FOUND");

    const filled = table.guests
      .filter((g) => g.id !== guestId)
      .reduce((sum, g) => sum + g.maxPax, 0);
    if (filled + guest.maxPax > table.capacity) throw new Error("TABLE_FULL");
  }

  return prisma.guest.update({ where: { id: guestId, clientId }, data: { tableId } });
}
