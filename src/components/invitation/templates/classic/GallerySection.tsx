"use client";

type GalleryType = "HERO" | "COVER" | "PREWEDDING" | "GALLERY";

interface GalleryItem {
  id: string;
  url: string;
  type: GalleryType;
  sortOrder: number;
}

interface Props {
  galleries: GalleryItem[];
}

export function GallerySection({ galleries }: Props) {
  const photos = galleries.filter(
    (g) => g.type === "GALLERY" || g.type === "PREWEDDING"
  );

  if (photos.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">
            Momen Bersama
          </p>
          <h2 className="font-heading text-3xl text-stone-800">Galeri</h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-4" />
        </div>

        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid rounded-lg overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
