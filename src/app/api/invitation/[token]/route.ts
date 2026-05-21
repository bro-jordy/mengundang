import { getGuestByToken } from "@/modules/guests/guests.service";
import { markGuestOpened } from "@/modules/guests/guests.service";
import { getDeviceType, apiError, apiSuccess } from "@/lib/utils";
import { headers } from "next/headers";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const guest = await getGuestByToken(token);
  if (!guest || !guest.isActive) {
    return apiError("Undangan tidak ditemukan", 404);
  }

  // track visit in background
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "";
  const userAgent = headersList.get("user-agent") || "";
  const device = getDeviceType(userAgent);

  markGuestOpened(guest.id, ip, userAgent, device).catch(() => {});

  return apiSuccess({
    guest: {
      id: guest.id,
      name: guest.name,
      maxPax: guest.maxPax,
      rsvpStatus: guest.rsvpStatus,
      rsvp: guest.rsvp,
    },
    client: guest.client,
  });
}
