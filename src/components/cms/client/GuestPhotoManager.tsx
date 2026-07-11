"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Download, RefreshCw, Camera, Users } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  createdAt: string;
  guest: { id: string; name: string } | null;
}

interface GroupedPhotos {
  guestId: string;
  guestName: string;
  photos: Photo[];
}

export function GuestPhotoManager({ clientId }: { clientId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "by-guest">("grid");

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/guest-photos`);
      const data = await res.json();
      if (data.data) setPhotos(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  async function deletePhoto(id: string) {
    if (!confirm("Hapus foto ini?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/clients/${clientId}/guest-photos/${id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Gagal menghapus foto");
    } finally {
      setDeleting(null);
    }
  }

  const grouped: GroupedPhotos[] = Object.values(
    photos.reduce<Record<string, GroupedPhotos>>((acc, photo) => {
      const key = photo.guest?.id ?? "unknown";
      const name = photo.guest?.name ?? "Tamu tidak dikenal";
      if (!acc[key]) acc[key] = { guestId: key, guestName: name, photos: [] };
      acc[key].photos.push(photo);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">Foto Tamu</h2>
          <p className="text-stone-500 text-sm mt-0.5">
            {loading ? "Memuat..." : `${photos.length} foto dari ${grouped.length} tamu`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "grid"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setView("by-guest")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "by-guest"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Per Tamu
          </button>
          <button
            onClick={loadPhotos}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Camera size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Belum ada foto dari tamu</p>
          <p className="text-xs mt-1">Foto akan muncul di sini setelah tamu mengupload</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid view */}
      {!loading && view === "grid" && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onDelete={deletePhoto} deleting={deleting} />
          ))}
        </div>
      )}

      {/* By-guest view */}
      {!loading && view === "by-guest" && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.guestId}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{group.guestName}</span>
                <span className="text-xs text-stone-400">{group.photos.length}/12 foto</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {group.photos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} onDelete={deletePhoto} deleting={deleting} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  onDelete,
  deleting,
  compact = false,
}: {
  photo: Photo;
  onDelete: (id: string) => void;
  deleting: string | null;
  compact?: boolean;
}) {
  const isDeleting = deleting === photo.id;

  return (
    <div className={`relative group rounded-xl overflow-hidden bg-stone-100 ${compact ? "aspect-square" : "aspect-square"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={`Foto dari ${photo.guest?.name ?? "tamu"}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
        {!compact && (
          <span className="text-white text-xs truncate max-w-[70%]">
            {photo.guest?.name ?? "?"}
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          <a
            href={photo.url}
            download
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={13} />
          </a>
          <button
            onClick={() => onDelete(photo.id)}
            disabled={isDeleting}
            className="w-7 h-7 rounded-lg bg-red-500/70 hover:bg-red-500 flex items-center justify-center text-white transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
