import { z } from "zod";

export const weddingProfileSchema = z.object({
  groomName: z.string().default(""),
  brideName: z.string().default(""),
  groomNickname: z.string().default(""),
  brideNickname: z.string().default(""),
  groomParents: z.string().default(""),
  brideParents: z.string().default(""),
  groomPhoto: z.string().optional().nullable(),
  bridePhoto: z.string().optional().nullable(),
  heroImage: z.string().optional().nullable(),
  story: z.string().optional().nullable(),
  openingQuote: z.string().optional().nullable(),
  openingQuoteBy: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  type: z.enum(["AKAD", "PEMBERKATAN", "RESEPSI", "AFTER_PARTY", "SANGJIT", "LAMARAN"]),
  label: z.string().default(""),
  date: z.string().optional().nullable(),
  timeStart: z.string().default(""),
  timeEnd: z.string().default(""),
  venueName: z.string().default(""),
  venueAddress: z.string().default(""),
  mapsUrl: z.string().default(""),
  mapsEmbed: z.string().default(""),
  sortOrder: z.number().default(0),
});

export type WeddingProfileInput = z.infer<typeof weddingProfileSchema>;
export type EventInput = z.infer<typeof eventSchema>;
