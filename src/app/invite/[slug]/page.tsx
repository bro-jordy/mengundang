import { getClientBySlug } from "@/modules/clients/clients.service";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/invitation/TemplateRenderer";
import { getSession } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  if (client.status !== "ACTIVE") {
    if (preview === "1") {
      const session = await getSession();
      if (!session?.user) notFound();
    } else {
      notFound();
    }
  }

  return <TemplateRenderer guest={null} client={client as any} token={null} />;
}
