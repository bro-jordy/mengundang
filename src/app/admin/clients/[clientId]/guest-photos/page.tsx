import { GuestPhotoManager } from "@/components/cms/client/GuestPhotoManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function GuestPhotosPage({ params }: Props) {
  const { clientId } = await params;
  return <GuestPhotoManager clientId={clientId} />;
}
