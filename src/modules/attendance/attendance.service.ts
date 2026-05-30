import { prisma } from "@/lib/database/prisma";
import type { AttendanceType } from "@prisma/client";

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
  const totalActualPax = attendances.reduce((sum, a) => sum + a.actualPax, 0);

  const totalGerejaOnly = guests.filter((g) => g.invitationCategory === "GEREJA_SAJA").length;
  const totalGerejaResepsi = guests.filter((g) => g.invitationCategory === "GEREJA_RESEPSI").length;

  return {
    totalGuests,
    totalHadir,
    totalPaxUndangan,
    totalActualPax,
    totalGerejaOnly,
    totalGerejaResepsi,
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

  const existing = await prisma.attendance.findUnique({
    where: { guestId_barcodeType: { guestId: guest.id, barcodeType } },
  });

  if (existing) {
    return {
      success: false,
      alreadyCheckedIn: true,
      arrivedAt: existing.arrivedAt,
      guest,
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
