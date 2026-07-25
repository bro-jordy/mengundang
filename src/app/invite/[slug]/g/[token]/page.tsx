import { GuestInvitationView, getGuestInvitationMetadata } from "@/components/invitation/GuestInvitationView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; token: string }>;
}

export default async function GuestInvitationPage({ params }: Props) {
  const { token } = await params;
  return <GuestInvitationView token={token} />;
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  return getGuestInvitationMetadata(token);
}
