import { randomBytes } from "crypto";

export function generateGuestToken(): string {
  return randomBytes(12).toString("base64url");
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
