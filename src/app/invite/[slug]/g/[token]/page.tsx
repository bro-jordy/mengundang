import { GuestInvitationView, getGuestInvitationMetadata } from "@/components/invitation/GuestInvitationView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function GuestInvitationPage({ params }: Props) {
  const { token } = await params;
  return <GuestInvitationView token={token} />;
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { token } = await params;
  const { lang } = await searchParams;
  return getGuestInvitationMetadata(token, lang === "en" ? "en" : "id");
}
