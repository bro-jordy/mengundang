import { prisma } from "@/lib/database/prisma";
import { generateGuestToken, generateInvitationUrl } from "@/lib/token";
import type { CreateGuestInput, UpdateGuestInput } from "./guests.schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getGuests(clientId: string) {
  return prisma.guest.findMany({
    where: { clientId },
    include: { rsvp: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuestByToken(token: string) {
  return prisma.guest.findUnique({
    where: { guestToken: token },
    include: {
      rsvp: true,
      client: {
        include: {
          weddingProfile: true,
          events: { orderBy: { sortOrder: "asc" } },
          galleries: { orderBy: { sortOrder: "asc" } },
          theme: true,
          musics: { where: { isActive: true } },
          sections: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          gifts: { where: { isActive: true } },
          wishes: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
    },
  });
}

export async function createGuest(
  clientId: string,
  data: CreateGuestInput,
  clientSlug: string
) {
  const token = generateGuestToken();
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);

  return prisma.guest.create({
    data: {
      clientId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      maxPax: data.maxPax,
      guestToken: token,
      invitationUrl,
    },
  });
}

export async function importGuests(
  clientId: string,
  guests: Array<{ name: string; phone?: string; email?: string; maxPax?: number }>,
  clientSlug: string
) {
  const rows = guests.map((g) => {
    const token = generateGuestToken();
    const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);
    return {
      clientId,
      name: g.name,
      phone: g.phone || null,
      email: g.email || null,
      maxPax: g.maxPax ?? 2,
      guestToken: token,
      invitationUrl,
    };
  });

  return prisma.guest.createMany({ data: rows });
}

export async function updateGuest(id: string, data: UpdateGuestInput) {
  return prisma.guest.update({ where: { id }, data });
}

export async function deleteGuest(id: string) {
  return prisma.guest.delete({ where: { id } });
}

export async function regenerateGuestToken(id: string, clientSlug: string) {
  const token = generateGuestToken();
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);
  return prisma.guest.update({
    where: { id },
    data: { guestToken: token, invitationUrl, isOpened: false, openedAt: null },
  });
}

export async function markGuestOpened(
  guestId: string,
  ip?: string,
  userAgent?: string,
  device?: string
) {
  await prisma.guest.update({
    where: { id: guestId },
    data: { isOpened: true, openedAt: new Date() },
  });

  await prisma.guestVisit.create({
    data: {
      guestId,
      clientId: (await prisma.guest.findUnique({ where: { id: guestId }, select: { clientId: true } }))!.clientId,
      ipAddress: ip,
      userAgent,
      device,
    },
  });
}

export async function updateGuestSendStatus(id: string) {
  return prisma.guest.update({
    where: { id },
    data: { sendStatus: "SENT" },
  });
}
