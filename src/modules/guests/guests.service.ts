import { cache } from "react";
import { prisma } from "@/lib/database/prisma";
import { generateGuestToken, generateInvitationUrl } from "@/lib/token";
import { randomBytes } from "crypto";
import type { CreateGuestInput, UpdateGuestInput, InvitationCategoryValue } from "./guests.schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateBarcode(): string {
  return randomBytes(10).toString("base64url");
}

function needsBarcodeReception(category: string): boolean {
  return [
    "GEREJA_RESEPSI",
    "AKAD_RESEPSI",
    "PEMBERKATAN_RESEPSI",
  ].includes(category);
}

export async function getGuests(clientId: string) {
  return prisma.guest.findMany({
    where: { clientId },
    include: { rsvp: true, attendances: true },
    orderBy: { createdAt: "desc" },
  });
}

export const getGuestByToken = cache(async function getGuestByToken(token: string) {
  return prisma.guest.findUnique({
    where: { guestToken: token },
    include: {
      rsvp: true,
      attendances: true,
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
});

export async function createGuest(
  clientId: string,
  data: CreateGuestInput,
  clientSlug: string,
  clientType?: string
) {
  const token = generateGuestToken(data.name);
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token, clientType);
  const barcodeChurch = generateBarcode();
  const barcodeReception = needsBarcodeReception(data.invitationCategory) ? generateBarcode() : null;

  return prisma.guest.create({
    data: {
      clientId,
      name: data.name,
      phone: data.phone || null,
      invitationCategory: data.invitationCategory,
      barcodeChurch,
      barcodeReception,
      maxPax: data.maxPax,
      guestToken: token,
      invitationUrl,
    },
  });
}

export async function importGuests(
  clientId: string,
  guests: Array<{ name: string; phone?: string; invitationCategory?: InvitationCategoryValue; maxPax?: number }>,
  clientSlug: string,
  clientType?: string
) {
  const rows = guests.map((g) => {
    const token = generateGuestToken(g.name);
    const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token, clientType);
    const category = g.invitationCategory ?? "AKAD_RESEPSI";
    return {
      clientId,
      name: g.name,
      phone: g.phone || null,
      invitationCategory: category,
      barcodeChurch: generateBarcode(),
      barcodeReception: needsBarcodeReception(category) ? generateBarcode() : null,
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

export async function regenerateGuestToken(id: string, clientSlug: string, clientType?: string) {
  const existing = await prisma.guest.findUnique({ where: { id }, select: { name: true } });
  const token = generateGuestToken(existing?.name);
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token, clientType);
  return prisma.guest.update({
    where: { id },
    data: { guestToken: token, invitationUrl, isOpened: false, openedAt: null },
  });
}

export async function regenerateGuestBarcodes(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new Error("Guest not found");

  return prisma.guest.update({
    where: { id },
    data: {
      barcodeChurch: generateBarcode(),
      barcodeReception: needsBarcodeReception(guest.invitationCategory) ? generateBarcode() : null,
    },
  });
}

export async function markGuestOpened(
  guestId: string,
  clientId: string,
  ip?: string,
  userAgent?: string,
  device?: string
) {
  await Promise.all([
    prisma.guest.update({
      where: { id: guestId },
      data: { isOpened: true, openedAt: new Date() },
    }),
    prisma.guestVisit.create({
      data: { guestId, clientId, ipAddress: ip, userAgent, device },
    }),
  ]);
}

export async function updateGuestSendStatus(id: string) {
  return prisma.guest.update({
    where: { id },
    data: { sendStatus: "SENT" },
  });
}
