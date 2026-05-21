"use client";

import { useState } from "react";
import { Trash2, Plus, Image, Upload, Link } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

type GalleryType = "HERO" | "COVER" | "PREWEDDING" | "GALLERY";
type InputMode = "upload" | "url";

interface GalleryItem {
  id: string;
  url: string;
  type: GalleryType;
  sortOrder: number;
}

interface Props {
  clientId: string;
  initialGalleries: GalleryItem[];
}

const TYPE_LABELS: Record<GalleryType, string> = {
  HERO: "Hero",
  COVER: "Cover",
  PREWEDDING: "Prewedding",
  GALLERY: "Galeri",
};

const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function GalleryManager({ clientId, initialGalleries }: Props) {
  const [galleries, setGalleries] = useState<GalleryItem[]>(initialGalleries);
  const [mode, setMode] = useState<InputMode>("upload");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<GalleryType>("GALLERY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { uploading, openPicker, inputProps } = useImageUpload({
    clientId,
    onSuccess: (uploadedUrl) => addToGallery(uploadedUrl),
    onError: (msg) => setError(msg),
  });

  async function addToGallery(photoUrl: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menambahkan foto");
        return;
      }
      setGalleries((prev) => [...prev, data]);
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  function handleAddUrl() {
    if (!url.trim()) return;
    addToGallery(url.trim());
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus foto ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/gallery`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGalleries((prev) => prev.filter((g) => g.id !== id));
  }

  const typeGroups = (Object.keys(TYPE_LABELS) as GalleryType[]).map((t) => ({
    type: t,
    label: TYPE_LABELS[t],
    items: galleries.filter((g) => g.type === t),
  }));

  const isBusy = saving || uploading;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Tambah Foto</h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "upload"
                ? "bg-stone-800 text-white"
                : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Upload size={12} />
            Upload dari Laptop
          </button>
          <button
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "url"
                ? "bg-stone-800 text-white"
                : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Link size={12} />
            Dari URL
          </button>
        </div>

        {/* Tipe selector (shared) */}
        <div className="mb-4 w-48">
          <label className={labelClass}>Tipe Foto</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GalleryType)}
            className={inputClass}
          >
            {(Object.entries(TYPE_LABELS) as [GalleryType, string][]).map(
              ([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              )
            )}
          </select>
          <p className="text-xs text-stone-400 mt-1">
            Hero/Cover: halaman pembuka. Prewedding/Galeri: section galeri.
          </p>
        </div>

        {mode === "upload" ? (
          <div>
            {/* Hidden file input */}
            <input {...inputProps} />

            {/* Drop zone / button */}
            <button
              onClick={openPicker}
              disabled={isBusy}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              <Upload size={24} className="text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500 font-medium">
                {uploading ? "Mengupload..." : "Klik untuk pilih foto"}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                JPG, PNG, WebP, GIF — maks. 15MB
              </p>
            </button>
          </div>
        ) : (
          <div>
            <label className={labelClass}>URL Foto</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                className={inputClass}
              />
              <button
                onClick={handleAddUrl}
                disabled={isBusy || !url.trim()}
                className="shrink-0 flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                {saving ? "..." : "Tambah"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {typeGroups.map(({ type: t, label, items }) => {
        if (items.length === 0) return null;
        return (
          <div key={t} className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Image size={16} className="text-stone-400" />
              {label}
              <span className="text-xs font-normal text-stone-400">
                ({items.length} foto)
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-md transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {galleries.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <Image size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">Belum ada foto</p>
          <p className="text-stone-400 text-xs mt-1">
            Upload foto dari laptop atau tambahkan dari URL.
          </p>
        </div>
      )}
    </div>
  );
}
