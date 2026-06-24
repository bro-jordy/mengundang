import { prisma } from "@/lib/database/prisma";
import type { AttendanceType } from "@prisma/client";

const SCAN_WINDOW_MS = 60 * 60 * 1000; // 1 jam
const WIB_OFFSET_MINUTES = 7 * 60; // UTC+7

function getEventStartUTC(date: Date | null, timeStart: string): Date | null {
  if (!date) return null;
  const match = timeStart.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const dateOnlyUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const minutesFromMidnightUTC = hours * 60 + minutes - WIB_OFFSET_MINUTES;
  return new Date(dateOnlyUTC + minutesFromMidnightUTC * 60 * 1000);
}

function formatWIBTime(dt: Date): string {
  const wib = new Date(dt.getTime() + WIB_OFFSET_MINUTES * 60 * 1000);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} WIB`;
}

export async function getAttendances(clientId: string) {
  return prisma.attendance.findMany({
    where: { clientId },
    include: {
      guest: true,
    },
    orderBy: { arrivedAt: "desc" },
  });
}

export async function getAttendanceStats(clientId: string) {
  const [guests, attendances] = await Promise.all([
    prisma.guest.findMany({
      where: { clientId, isActive: true },
      select: { id: true, maxPax: true, invitationCategory: true },
    }),
    prisma.attendance.findMany({
      where: { clientId },
      include: { guest: { select: { maxPax: true, invitationCategory: true } } },
    }),
  ]);

  const totalGuests = guests.length;
  const totalPaxUndangan = guests.reduce((sum, g) => sum + g.maxPax, 0);

  const checkedInGuestIds = new Set(attendances.map((a) => a.guestId));
  const totalHadir = checkedInGuestIds.size;

  const churchActualPax = attendances
    .filter((a) => a.barcodeType === "CHURCH")
    .reduce((sum, a) => sum + a.actualPax, 0);
  const receptionActualPax = attendances
    .filter((a) => a.barcodeType === "RECEPTION")
    .reduce((sum, a) => sum + a.actualPax, 0);
  const nasiBoxAttendances = attendances.filter(
    (a) => a.barcodeType === "CHURCH" && a.guest.invitationCategory === "PEMBERKATAN_NASI_BOX"
  );
  const nasiBoxPax = nasiBoxAttendances.reduce((sum, a) => sum + a.actualPax, 0);
  const nasiBoxCount = nasiBoxAttendances.length;

  const categoryCount: Record<string, number> = {};
  for (const g of guests) {
    categoryCount[g.invitationCategory] = (categoryCount[g.invitationCategory] ?? 0) + 1;
  }
  const perCategory = Object.entries(categoryCount).map(([category, count]) => ({ category, count }));

  return {
    totalGuests,
    totalHadir,
    totalPaxUndangan,
    churchActualPax,
    receptionActualPax,
    nasiBoxPax,
    nasiBoxCount,
    perCategory,
  };
}

export async function scanBarcode(clientId: string, barcode: string) {
  const guest = await prisma.guest.findFirst({
    where: {
      clientId,
      OR: [{ barcodeChurch: barcode }, { barcodeReception: barcode }],
    },
  });

  if (!guest) {
    return { success: false, error: "Barcode tidak ditemukan" } as const;
  }

  const barcodeType: AttendanceType =
    guest.barcodeChurch === barcode ? "CHURCH" : "RECEPTION";

  // Validasi jendela waktu scan
  const eventType = barcodeType === "CHURCH" ? "PEMBERKATAN" : "RESEPSI";
  const event = await prisma.event.findFirst({
    where: { clientId, type: eventType },
    orderBy: { sortOrder: "asc" },
  });

  if (event && event.date) {
    const eventStart = getEventStartUTC(event.date, event.timeStart);
    if (eventStart) {
      const now = new Date();
      const windowStart = new Date(eventStart.getTime() - SCAN_WINDOW_MS);
      const windowEnd = new Date(eventStart.getTime() + SCAN_WINDOW_MS);

      if (now < windowStart || now > windowEnd) {
        const label = barcodeType === "CHURCH" ? "Gereja" : "Resepsi";
        return {
          success: false,
          outsideWindow: true,
          barcodeType,
          error: `Scan ${label} hanya tersedia ${formatWIBTime(windowStart)} – ${formatWIBTime(windowEnd)}`,
        } as const;
      }
    }
  }

  const existing = await prisma.attendance.findUnique({
    where: { guestId_barcodeType: { guestId: guest.id, barcodeType } },
  });

  if (existing) {
    return {
      success: false,
      alreadyCheckedIn: true,
      arrivedAt: existing.arrivedAt,
      guest,
      barcodeType,
    } as const;
  }

  const attendance = await prisma.attendance.create({
    data: {
      guestId: guest.id,
      clientId,
      barcodeType,
      arrivedAt: new Date(),
      actualPax: guest.maxPax,
    },
    include: { guest: true },
  });

  return { success: true, attendance, barcodeType } as const;
}

export async function updateAttendanceActualPax(
  attendanceId: string,
  actualPax: number
) {
  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { actualPax },
  });
}
