import { z } from "zod";

const INVITATION_CATEGORIES = [
  "GEREJA_SAJA",
  "GEREJA_RESEPSI",
  "AKAD",
  "AKAD_RESEPSI",
  "PEMBERKATAN",
  "PEMBERKATAN_RESEPSI",
  "SANGJIT",
  "LAMARAN",
] as const;

export const createGuestSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().nullable(),
  invitationCategory: z.enum(INVITATION_CATEGORIES),
  maxPax: z.number().int().min(1).default(2),
});

export const updateGuestSchema = createGuestSchema.partial();

export const importGuestsSchema = z.array(
  z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    invitationCategory: z.enum(INVITATION_CATEGORIES).optional().default("AKAD_RESEPSI"),
    maxPax: z.number().optional().default(2),
  })
);

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type InvitationCategoryValue = typeof INVITATION_CATEGORIES[number];
