import { z } from "zod";

export const createGuestSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().nullable(),
  invitationCategory: z.enum(["GEREJA_SAJA", "GEREJA_RESEPSI"]),
  maxPax: z.number().int().min(1).default(2),
});

export const updateGuestSchema = createGuestSchema.partial();

export const importGuestsSchema = z.array(
  z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    invitationCategory: z.enum(["GEREJA_SAJA", "GEREJA_RESEPSI"]).optional().default("GEREJA_RESEPSI"),
    maxPax: z.number().optional().default(2),
  })
);

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
