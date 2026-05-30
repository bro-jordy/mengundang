import { getAttendances, getAttendanceStats } from "@/modules/attendance/attendance.service";
import { AttendanceManager } from "@/components/cms/client/AttendanceManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function AttendancePage({ params }: Props) {
  const { clientId } = await params;

  const [attendances, stats] = await Promise.all([
    getAttendances(clientId),
    getAttendanceStats(clientId),
  ]);

  const serialized = attendances.map((a) => ({
    ...a,
    arrivedAt: a.arrivedAt.toISOString(),
    guest: {
      id: a.guest.id,
      name: a.guest.name,
      phone: a.guest.phone,
      maxPax: a.guest.maxPax,
      invitationCategory: a.guest.invitationCategory,
    },
  }));

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Kehadiran Tamu</h2>
      <AttendanceManager
        clientId={clientId}
        initialAttendances={serialized as any}
        initialStats={stats}
      />
    </div>
  );
}
