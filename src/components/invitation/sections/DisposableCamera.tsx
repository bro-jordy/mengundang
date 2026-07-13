"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, ImagePlus, AlertCircle, CalendarClock } from "lucide-react";

const MAX_PHOTOS = 12;
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.75;

function isHeic(file: File): boolean {
  if (["image/heic", "image/heif"].includes(file.type.toLowerCase())) return true;
  return /\.hei[cf]$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(result) ? result[0] : result;
}

async function compressImage(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Gagal kompres gambar"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Gagal membaca gambar"));
    img.src = objectUrl;
  });
}

function formatDateId(date: Date): string {
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

interface Photo {
  id: string;
  url: string;
}

interface Props {
  token: string;
  clientId: string;
  guestName: string;
  rsvpStatus: string | null;
  eventDates: string[]; // ISO strings
}

export function DisposableCamera({ token, clientId, guestName, rsvpStatus, eventDates }: Props) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Compute upload window from event dates
  const sortedDates = eventDates
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const windowStart = sortedDates.length > 0
    ? new Date(new Date(sortedDates[0]).setHours(0, 0, 0, 0))
    : null;
  const windowEnd = sortedDates.length > 0
    ? new Date(new Date(sortedDates[sortedDates.length - 1]).setHours(0, 0, 0, 0) + 2 * 86400000 - 1)
    : null;
  const firstEventDate = sortedDates[0] ?? null;

  const now = new Date();
  const isBeforeWindow = windowStart ? now < windowStart : false;
  const isAfterWindow = windowEnd ? now > windowEnd : false;
  const canUpload = !isBeforeWindow && !isAfterWindow;

  const loadPhotos = useCallback(async () => {
    if (rsvpStatus !== "HADIR") return;
    try {
      const res = await fetch(`/api/guest-photos?token=${token}`);
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch {
      // silently fail
    } finally {
      setLoaded(true);
    }
  }, [token, rsvpStatus]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // Gate: only show if RSVP'd as attending and within or before the window
  if (rsvpStatus !== "HADIR") return null;
  if (isAfterWindow) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (photos.length >= MAX_PHOTOS) {
      setError("Film sudah habis! Semua 12 foto sudah terpakai.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const source = isHeic(file) ? await heicToJpeg(file) : file;
      const compressed = await compressImage(source);
      const formData = new FormData();
      formData.append("file", compressed, "photo.jpg");
      formData.append("token", token);
      formData.append("clientId", clientId);
      const res = await fetch("/api/guest-photos", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupload foto");
      setPhotos((prev) => [...prev, { id: data.id, url: data.url }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  }

  const remaining = MAX_PHOTOS - photos.length;
  const filmSlots = Array.from({ length: MAX_PHOTOS });

  return (
    <>
      {/* Floating camera button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        style={{ background: "rgba(20,20,20,0.85)", backdropFilter: "blur(8px)", zIndex: 300 }}
        aria-label="Buka kamera tamu"
      >
        <Camera size={20} className="text-white" />
        {loaded && photos.length > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white"
            style={{ background: "#c8902a", fontSize: "10px" }}
          >
            {photos.length}
          </span>
        )}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 400, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-2xl overflow-hidden flex flex-col"
            style={{ background: "#141414", maxHeight: "90dvh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-white font-semibold text-sm">Kamera Tamu</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {guestName}{canUpload ? ` · ${photos.length}/${MAX_PHOTOS} foto` : ""}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Before window: show notice instead of camera UI */}
            {isBeforeWindow ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(200,144,42,0.15)" }}>
                  <CalendarClock size={26} style={{ color: "#c8902a" }} />
                </div>
                <p className="text-white font-semibold text-base mb-2">Kamera Belum Tersedia</p>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Fitur foto bisa digunakan mulai
                </p>
                <p className="font-semibold text-lg mb-1" style={{ color: "#c8902a" }}>
                  {firstEventDate ? formatDateId(firstEventDate) : "—"}
                </p>
                <p className="text-white/30 text-xs mt-4">Sampai jumpa di sana! 📸</p>
              </div>
            ) : (
              <>
                {/* Film strip counter */}
                <div className="px-5 pt-4 pb-2 flex gap-1.5 overflow-x-auto">
                  {filmSlots.map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-5 h-2 rounded-sm transition-colors"
                      style={{ background: i < photos.length ? "#c8902a" : "rgba(255,255,255,0.1)" }}
                    />
                  ))}
                </div>
                <p className="px-5 pb-3 text-white/40 text-xs">
                  {remaining > 0 ? `${remaining} frame tersisa` : "Film habis"}
                </p>

                {/* Photos grid */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Camera size={32} className="text-white/20 mb-3" />
                      <p className="text-white/50 text-sm">Belum ada foto</p>
                      <p className="text-white/30 text-xs mt-1">Upload foto pertamamu di bawah</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden" style={{ background: "#222" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt="Foto tamu" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ))}
                      {remaining > 0 && Array.from({ length: Math.min(remaining, 3) }).map((_, i) => (
                        <div
                          key={`ghost-${i}`}
                          className="aspect-square rounded-lg"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(220,50,50,0.15)" }}>
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                {/* Upload button */}
                <div className="px-5 pb-6 pt-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <button
                    onClick={() => { setError(null); fileRef.current?.click(); }}
                    disabled={uploading || remaining === 0}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                    style={{ background: remaining === 0 ? "#333" : "#c8902a", color: "white" }}
                  >
                    {uploading ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Mengupload...</>
                    ) : remaining === 0 ? "Film sudah habis" : (
                      <><ImagePlus size={16} />Ambil / Upload Foto</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
