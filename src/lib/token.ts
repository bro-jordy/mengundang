import { randomBytes } from "crypto";

export function generateGuestToken(guestName?: string): string {
  const random = randomBytes(4).toString("base64url").slice(0, 6);
  if (!guestName) return random;

  const slug = guestName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);

  return slug ? `${slug}_${random}` : random;
}

const CLIENT_TYPE_SUBDOMAIN: Record<string, string> = {
  WEDDING: "pernikahan",
  LAMARAN: "lamaran",
  SANGJIT: "sangjit",
};

export function generateInvitationUrl(
  appUrl: string,
  clientSlug: string,
  token: string,
  clientType?: string
): string {
  const domain = process.env.NEXT_PUBLIC_INVITATION_DOMAIN;
  if (domain && clientType) {
    const subdomain = CLIENT_TYPE_SUBDOMAIN[clientType] ?? "pernikahan";
    return `https://${subdomain}.${domain}/${token}`;
  }
  return `${appUrl}/invite/${clientSlug}/g/${token}`;
}
