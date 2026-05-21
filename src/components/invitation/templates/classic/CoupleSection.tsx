interface Profile {
  groomName: string;
  brideName: string;
  groomNickname: string;
  brideNickname: string;
  groomParents: string;
  brideParents: string;
  groomPhoto: string | null;
  bridePhoto: string | null;
  story: string | null;
}

interface Props {
  profile: Profile | null;
}

export function CoupleSection({ profile }: Props) {
  if (!profile) return null;

  return (
    <section className="py-20 px-6 max-w-2xl mx-auto text-center">
      <p className="text-xs tracking-widest uppercase text-stone-400 mb-10">
        Mempelai
      </p>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          {profile.groomPhoto ? (
            <img
              src={profile.groomPhoto}
              alt={profile.groomName}
              className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-stone-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-stone-100 mb-4 flex items-center justify-center">
              <span className="text-4xl text-stone-400">👤</span>
            </div>
          )}
          <h2 className="font-heading text-2xl text-stone-800">
            {profile.groomNickname || profile.groomName}
          </h2>
          <p className="text-sm text-stone-600 mt-1">{profile.groomName}</p>
          {profile.groomParents && (
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              {profile.groomParents}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center">
          {profile.bridePhoto ? (
            <img
              src={profile.bridePhoto}
              alt={profile.brideName}
              className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-stone-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-stone-100 mb-4 flex items-center justify-center">
              <span className="text-4xl text-stone-400">👤</span>
            </div>
          )}
          <h2 className="font-heading text-2xl text-stone-800">
            {profile.brideNickname || profile.brideName}
          </h2>
          <p className="text-sm text-stone-600 mt-1">{profile.brideName}</p>
          {profile.brideParents && (
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              {profile.brideParents}
            </p>
          )}
        </div>
      </div>

      {profile.story && (
        <div className="mt-12 text-sm text-stone-600 leading-relaxed italic border-t border-stone-200 pt-8">
          <p>&ldquo;{profile.story}&rdquo;</p>
        </div>
      )}
    </section>
  );
}
