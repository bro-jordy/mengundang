"use client";

import { useState, useRef } from "react";
import { Trash2, Music, Plus, Upload, Link, Play, Pause, Radio } from "lucide-react";

interface MusicItem {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface Props {
  clientId: string;
  initialMusics: MusicItem[];
}

type InputMode = "upload" | "url";

const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function MusicManager({ clientId, initialMusics }: Props) {
  const [musics, setMusics] = useState<MusicItem[]>(initialMusics);
  const [mode, setMode] = useState<InputMode>("upload");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadAndAdd(file: File) {
    if (!title.trim()) { setError("Isi judul lagu terlebih dahulu"); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload gagal"); return; }
      await addMusic(title.trim(), data.url);
    } finally {
      setUploading(false);
    }
  }

  async function addMusic(songTitle: string, songUrl: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: songTitle, url: songUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menambahkan"); return; }
      // Adding a new music deactivates all others server-side
      setMusics((prev) => [...prev.map((m) => ({ ...m, isActive: false })), data]);
      setTitle("");
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    uploadAndAdd(file);
  }

  function handleAddUrl() {
    if (!title.trim() || !url.trim()) {
      setError("Judul dan URL harus diisi");
      return;
    }
    addMusic(title.trim(), url.trim());
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/clients/${clientId}/music`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    if (res.ok) {
      setMusics((prev) =>
        isActive
          ? prev.map((m) => ({ ...m, isActive: m.id === id }))
          : prev.map((m) => (m.id === id ? { ...m, isActive: false } : m))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus lagu ini?")) return;
    // Stop preview if playing
    if (previewId === id) {
      audioRefs.current[id]?.pause();
      setPreviewId(null);
    }
    const res = await fetch(`/api/clients/${clientId}/music`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setMusics((prev) => prev.filter((m) => m.id !== id));
  }

  function handlePreview(music: MusicItem) {
    // Pause any other playing audio
    Object.entries(audioRefs.current).forEach(([pid, audio]) => {
      if (pid !== music.id) { audio.pause(); audio.currentTime = 0; }
    });

    const audio = audioRefs.current[music.id];
    if (!audio) return;

    if (previewId === music.id) {
      audio.pause();
      setPreviewId(null);
    } else {
      audio.play().catch(() => {});
      setPreviewId(music.id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-1">Tambah Lagu</h2>
        <p className="text-xs text-stone-400 mb-4">
          Hanya satu lagu yang aktif sekaligus. Menambah lagu baru otomatis menjadikannya aktif.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "upload" ? "bg-stone-800 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Upload size={12} /> Upload File
          </button>
          <button
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "url" ? "bg-stone-800 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Link size={12} /> Dari URL
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Judul Lagu</label>
            <input
              type="text"
              placeholder="Cinta Luar Biasa - Andmesh"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {mode === "upload" ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm,audio/aac,audio/mp4"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="w-full border-2 border-dashed border-stone-200 rounded-xl p-5 text-center hover:border-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                <Upload size={20} className="text-stone-300 mx-auto mb-1.5" />
                <p className="text-sm text-stone-500 font-medium">
                  {uploading ? "Mengupload..." : "Klik untuk pilih file audio"}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">MP3, OGG, WAV, AAC — maks. 30MB</p>
              </button>
            </>
          ) : (
            <div>
              <label className={labelClass}>URL Lagu</label>
              <input
                type="url"
                placeholder="https://example.com/song.mp3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Gunakan URL langsung ke file audio (MP3, OGG, WAV)
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        {mode === "url" && (
          <button
            onClick={handleAddUrl}
            disabled={saving}
            className="mt-4 flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
            {saving ? "Menyimpan..." : "Tambah Lagu"}
          </button>
        )}
      </div>

      {/* Music list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">
            Daftar Lagu
            <span className="ml-2 text-xs font-normal text-stone-400">({musics.length} lagu)</span>
          </h2>
        </div>

        {musics.length === 0 ? (
          <div className="p-10 text-center">
            <Music size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Belum ada lagu ditambahkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {musics.map((music) => (
              <div key={music.id} className="flex items-center gap-3 px-6 py-4">
                {/* Hidden audio for preview */}
                <audio
                  ref={(el) => { if (el) audioRefs.current[music.id] = el; }}
                  src={music.url}
                  preload="none"
                  onEnded={() => setPreviewId(null)}
                />

                {/* Preview button */}
                <button
                  onClick={() => handlePreview(music)}
                  className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 shrink-0 transition-colors"
                >
                  {previewId === music.id ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{music.title}</p>
                  <p className="text-xs text-stone-400 truncate">{music.url}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggle(music.id, !music.isActive)}
                    title={music.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      music.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <Radio size={10} />
                    {music.isActive ? "Aktif" : "Nonaktif"}
                  </button>

                  <button
                    onClick={() => handleDelete(music.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>Catatan:</strong> Lagu akan otomatis diputar saat tamu membuka undangan (setelah klik "Buka Undangan").
          Browser mungkin memblokir autoplay jika tidak ada interaksi pengguna terlebih dahulu.
        </p>
      </div>
    </div>
  );
}
