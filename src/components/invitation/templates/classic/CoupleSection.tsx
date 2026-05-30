function storyToHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (s.includes("<")) return s;
  return s.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

interface Profile {
  groomName: string;
  brideName: string;
  groomNickname: string;
  brideNickname: string;
  groomParents: string;
  brideParents: string;
  groomPhoto: string | null;
  bridePhoto: string | null;
  showGroomPhoto: boolean;
  showBridePhoto: boolean;
  story: string | null;
  storyTitle: string | null;
  showStoryTitle: boolean;
}

interface Props {
  profile: Profile | null;
}

export function CoupleSection({ profile }: Props) {
  if (!profile) return null;

  return (
    <section className="py-20 px-6 max-w-2xl mx-auto text-center">
      <style>{`
        .story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .story-html li { margin: 0.15em 0; }
        .story-html strong, .story-html b { font-weight: 600; }
        .story-html em, .story-html i { font-style: italic; }
        .story-html p { margin: 0.4em 0; }
        .story-html p:first-child { margin-top: 0; }
        .story-html p:last-child { margin-bottom: 0; }
      `}</style>
      <p className="text-xs tracking-widest uppercase text-stone-400 mb-10">
        Mempelai
      </p>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          {profile.showGroomPhoto && (
            profile.groomPhoto ? (
              <img
                src={profile.groomPhoto}
                alt={profile.groomName}
                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-stone-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-stone-100 mb-4 flex items-center justify-center">
                <span className="text-4xl text-stone-400">👤</span>
              </div>
            )
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
          {profile.showBridePhoto && (
            profile.bridePhoto ? (
              <img
                src={profile.bridePhoto}
                alt={profile.brideName}
                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-stone-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-stone-100 mb-4 flex items-center justify-center">
                <span className="text-4xl text-stone-400">👤</span>
              </div>
            )
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
        <div className="mt-12 border-t border-stone-200 pt-8">
          {profile.showStoryTitle && (
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">
              {profile.storyTitle?.trim() || "Cerita Singkat Pasangan"}
            </p>
          )}
          <div
            className="story-html text-sm font-light leading-relaxed"
            style={{ color: "#6b7280", opacity: 0.6 }}
            dangerouslySetInnerHTML={{ __html: storyToHtml(profile.story) }}
          />
        </div>
      )}
    </section>
  );
}
