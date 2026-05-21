import { formatDate } from "@/lib/utils";

interface Profile {
  groomName: string;
  brideName: string;
  groomNickname: string;
  brideNickname: string;
  openingQuote: string | null;
  openingQuoteBy: string | null;
  heroImage: string | null;
}

interface Props {
  profile: Profile | null;
}

export function HeroSection({ profile }: Props) {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 relative"
      style={
        profile?.heroImage
          ? {
              backgroundImage: `url(${profile.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {profile?.heroImage && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      <div className="relative z-10">
        {profile?.openingQuote && (
          <div className="mb-10 max-w-sm mx-auto">
            <p className="text-sm italic leading-relaxed text-stone-600">
              &ldquo;{profile.openingQuote}&rdquo;
            </p>
            {profile.openingQuoteBy && (
              <p className="text-xs text-stone-400 mt-2">— {profile.openingQuoteBy}</p>
            )}
          </div>
        )}

        <p className="text-xs tracking-widest uppercase text-stone-500 mb-6">
          The Wedding of
        </p>

        <h1 className="font-heading text-6xl md:text-7xl text-stone-800 leading-tight">
          {profile?.groomNickname || "Groom"}
        </h1>
        <p className="font-heading text-3xl text-stone-500 my-2">&</p>
        <h1 className="font-heading text-6xl md:text-7xl text-stone-800 leading-tight">
          {profile?.brideNickname || "Bride"}
        </h1>

        <div className="mt-10 w-16 h-px bg-stone-400 mx-auto" />
      </div>
    </section>
  );
}
