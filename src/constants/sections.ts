import { SectionKey } from "@/types/prisma.types";

export const SECTION_LABELS: Record<SectionKey, string> = {
  HERO: "Hero / Cover",
  COUPLE: "Profil Mempelai",
  EVENT: "Detail Acara",
  GALLERY: "Galeri Foto",
  LOVE_STORY: "Love Story",
  RSVP: "RSVP Konfirmasi",
  WISHES: "Ucapan & Doa",
  GIFT: "Amplop Digital",
  MAPS: "Peta Lokasi",
  CLOSING: "Penutup",
};

export const DEFAULT_SECTIONS: { sectionKey: SectionKey; sortOrder: number; isActive: boolean }[] = [
  { sectionKey: "HERO", sortOrder: 1, isActive: true },
  { sectionKey: "COUPLE", sortOrder: 2, isActive: true },
  { sectionKey: "EVENT", sortOrder: 3, isActive: true },
  { sectionKey: "GALLERY", sortOrder: 4, isActive: true },
  { sectionKey: "LOVE_STORY", sortOrder: 5, isActive: false },
  { sectionKey: "RSVP", sortOrder: 6, isActive: true },
  { sectionKey: "WISHES", sortOrder: 7, isActive: true },
  { sectionKey: "GIFT", sortOrder: 8, isActive: true },
  { sectionKey: "MAPS", sortOrder: 9, isActive: true },
  { sectionKey: "CLOSING", sortOrder: 10, isActive: true },
];
