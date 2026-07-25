import { z } from "zod";

export const createTableSchema = z.object({
  sectionLabel: z.string().min(1, "Section wajib diisi"),
  code: z.string().min(1, "Kode meja wajib diisi"),
  capacity: z.number().int().min(1),
  sortOrder: z.number().int().optional(),
});

export const updateTableSchema = z.object({
  id: z.string().min(1),
  sectionLabel: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

export const assignGuestSchema = z.object({
  guestId: z.string().min(1),
  tableId: z.string().min(1).nullable(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type AssignGuestInput = z.infer<typeof assignGuestSchema>;
