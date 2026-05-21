import { getClientBySlug } from "@/modules/clients/clients.service";
import { notFound } from "next/navigation";
import { ClassicTemplate } from "@/components/invitation/templates/classic";
import { getSession } from "@/lib/auth/permissions";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  // Allow preview for authenticated admins even when DRAFT/ARCHIVED
  if (client.status !== "ACTIVE") {
    if (preview === "1") {
      const session = await getSession();
      if (!session?.user) notFound();
    } else {
      notFound();
    }
  }

  return (
    <ClassicTemplate
      guest={null}
      client={client}
      token={null}
    />
  );
}
