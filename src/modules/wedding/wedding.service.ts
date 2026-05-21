import { prisma } from "@/lib/database/prisma";
import type { WeddingProfileInput, EventInput } from "./wedding.schema";

export async function getWeddingProfile(clientId: string) {
  return prisma.weddingProfile.findUnique({ where: { clientId } });
}

export async function upsertWeddingProfile(
  clientId: string,
  data: WeddingProfileInput
) {
  return prisma.weddingProfile.upsert({
    where: { clientId },
    update: data,
    create: { clientId, ...data },
  });
}

export async function getEvents(clientId: string) {
  return prisma.event.findMany({
    where: { clientId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function upsertEvent(
  clientId: string,
  data: EventInput,
  eventId?: string
) {
  const eventData = {
    ...data,
    date: data.date ? new Date(data.date) : null,
    clientId,
  };

  if (eventId) {
    return prisma.event.update({ where: { id: eventId }, data: eventData });
  }

  return prisma.event.create({ data: eventData });
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}
