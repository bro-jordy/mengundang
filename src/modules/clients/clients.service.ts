import { cache } from "react";
import { prisma } from "@/lib/database/prisma";
import { DEFAULT_SECTIONS } from "@/constants/sections";
import { DEFAULT_TEMPLATE } from "@/lib/whatsapp";
import type { CreateClientInput, UpdateClientInput } from "./clients.schema";

export async function getAllClients(userId: string, role: string) {
  if (role === "SUPERADMIN") {
    return prisma.client.findMany({
      include: { weddingProfile: true, _count: { select: { guests: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.client.findMany({
    where: { clientUsers: { some: { userId } } },
    include: { weddingProfile: true, _count: { select: { guests: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      weddingProfile: true,
      events: { orderBy: { sortOrder: "asc" } },
      theme: true,
      sections: { orderBy: { sortOrder: "asc" } },
      musics: true,
      gifts: true,
      whatsappTemplate: true,
      _count: {
        select: {
          guests: true,
          wishes: true,
        },
      },
    },
  });
}

export const getClientBySlug = cache(async function getClientBySlug(slug: string) {
  return prisma.client.findUnique({
    where: { slug },
    include: {
      weddingProfile: true,
      events: { orderBy: { sortOrder: "asc" } },
      galleries: { orderBy: { sortOrder: "asc" } },
      theme: true,
      musics: { where: { isActive: true } },
      sections: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      gifts: { where: { isActive: true } },
      loveStories: { orderBy: { sortOrder: "asc" } },
      wishes: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
});

export async function createClient(data: CreateClientInput, userId: string) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      slug: data.slug,
      status: data.status,
      clientType: data.clientType ?? "WEDDING",
      createdById: userId,
      weddingProfile: { create: {} },
      theme: {
        create: {
          templateSlug: "dark",
          primaryColor: "#c4a07a",
          secondaryColor: "#f5f5f5",
          bgColor: "#ffffff",
          textColor: "#1a1a1a",
          fontHeading: "Cormorant",
          fontBody: "IBM Plex Sans",
        },
      },
      sections: { create: DEFAULT_SECTIONS },
      whatsappTemplate: { create: { bodyTemplate: DEFAULT_TEMPLATE } },
    },
  });

  await prisma.clientUser.create({
    data: { userId, clientId: client.id },
  });

  return client;
}

export async function updateClient(id: string, data: UpdateClientInput) {
  return prisma.client.update({ where: { id }, data });
}

export async function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } });
}

export async function isSlugTaken(slug: string, excludeId?: string) {
  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) return false;
  if (excludeId && client.id === excludeId) return false;
  return true;
}
