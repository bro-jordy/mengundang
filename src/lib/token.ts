import { randomBytes } from "crypto";

export function generateGuestToken(): string {
  return randomBytes(12).toString("base64url");
}

export function generateInvitationUrl(
  appUrl: string,
  clientSlug: string,
  token: string
): string {
  return `${appUrl}/invite/${clientSlug}/g/${token}`;
}
