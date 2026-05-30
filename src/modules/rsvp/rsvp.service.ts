import { prisma } from "@/lib/database/prisma";
import type { RsvpInput, WishInput } from "./rsvp.schema";

export async function submitRsvp(data: RsvpInput) {
  const guest = await prisma.guest.findUnique({
    where: { guestToken: data.token },
    select: { id: true, clientId: true, isActive: true },
  });

  if (!guest || !guest.isActive) {
    throw new Error("INVALID_TOKEN");
  }

  const rsvp = await prisma.rsvp.upsert({
    where: { guestId: guest.id },
    update: {
      name: data.name,
      paxCount: data.paxCount,
      status: data.status,
      message: data.message || null,
    },
    create: {
      guestId: guest.id,
      clientId: guest.clientId,
      name: data.name,
      paxCount: data.paxCount,
      status: data.status,
      message: data.message || null,
    },
  });

  await prisma.guest.update({
    where: { id: guest.id },
    data: { rsvpStatus: data.status },
  });

  return rsvp;
}

export async function getRsvps(clientId: string) {
  return prisma.rsvp.findMany({
    where: { clientId },
    include: { guest: { select: { name: true, phone: true, maxPax: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitWish(data: WishInput) {
  return prisma.wish.create({
    data: {
      clientId: data.clientId,
      guestId: data.guestId || null,
      name: data.name,
      message: data.message,
      isApproved: true,
    },
  });
}

export async function getWishes(clientId: string) {
  return prisma.wish.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateWish(id: string, data: { isApproved?: boolean; reply?: string | null }) {
  return prisma.wish.update({ where: { id }, data });
}
