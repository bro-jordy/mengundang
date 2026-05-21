import { getWeddingProfile } from "@/modules/wedding/wedding.service";
import { ProfileForm } from "@/components/cms/client/ProfileForm";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { clientId } = await params;
  const profile = await getWeddingProfile(clientId);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">
        Profil Mempelai
      </h2>
      <ProfileForm clientId={clientId} initialData={profile} />
    </div>
  );
}
