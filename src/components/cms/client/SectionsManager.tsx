"use client";

import { useState } from "react";
import { Eye, EyeOff, Timer } from "lucide-react";

interface Section {
  id: string;
  sectionKey: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  HERO: "Banner pembuka dengan nama pasangan",
  COUPLE: "Profil dan foto mempelai pria & wanita",
  EVENT: "Jadwal dan detail acara pernikahan",
  GALLERY: "Galeri foto prewedding dan acara",
  LOVE_STORY: "Cerita perjalanan cinta pasangan",
  RSVP: "Form konfirmasi kehadiran tamu",
  WISHES: "Ucapan dan doa dari tamu",
  GIFT: "Amplop digital / rekening transfer",
  MAPS: "Peta lokasi acara",
  CLOSING: "Penutup undangan",
};

interface Props {
  clientId: string;
  initialSections: Section[];
  showCountdown: boolean;
}

export function SectionsManager({ clientId, initialSections, showCountdown: initialShowCountdown }: Props) {
  const [sections, setSections] = useState<Section[]>(
    [...initialSections].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(initialShowCountdown);
  const [countdownSaving, setCountdownSaving] = useState(false);

  async function toggle(sectionKey: string, current: boolean) {
    setLoading(sectionKey);
    const res = await fetch(`/api/clients/${clientId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionKey, isActive: !current }),
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sectionKey ? { ...s, isActive: !current } : s))
      );
    }
    setLoading(null);
  }

  async function toggleCountdown(value: boolean) {
    setShowCountdown(value);
    setCountdownSaving(true);
    await fetch(`/api/clients/${clientId}/theme`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showCountdown: value }),
    });
    setCountdownSaving(false);
  }

  const active = sections.filter((s) => s.isActive);
  const inactive = sections.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Display options */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
          <Timer size={14} className="text-stone-500" /> Elemen Tambahan
        </h3>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-stone-800">Hitung Mundur (Countdown)</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Tampilkan countdown ke tanggal acara pertama di undangan
            </p>
          </div>
          <button
            onClick={() => toggleCountdown(!showCountdown)}
            disabled={countdownSaving}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${showCountdown ? "bg-stone-800" : "bg-stone-300"}`}
            title={showCountdown ? "Nonaktifkan countdown" : "Aktifkan countdown"}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showCountdown ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Tip:</span> Section yang dinonaktifkan tidak akan tampil di undangan. Perubahan langsung berlaku.
        </p>
      </div>

      {/* Active sections */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
          <Eye size={14} className="text-green-600" /> Ditampilkan ({active.length})
        </h3>
        <div className="space-y-2">
          {active.map((s) => (
            <SectionRow key={s.sectionKey} section={s} loading={loading === s.sectionKey} onToggle={toggle} />
          ))}
          {active.length === 0 && (
            <p className="text-stone-400 text-sm text-center py-4 bg-stone-50 rounded-xl">Tidak ada section yang aktif</p>
          )}
        </div>
      </div>

      {/* Inactive sections */}
      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-400 mb-3 flex items-center gap-2">
            <EyeOff size={14} /> Disembunyikan ({inactive.length})
          </h3>
          <div className="space-y-2">
            {inactive.map((s) => (
              <SectionRow key={s.sectionKey} section={s} loading={loading === s.sectionKey} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionRow({ section, loading, onToggle }: {
  section: Section;
  loading: boolean;
  onToggle: (key: string, current: boolean) => void;
}) {
  return (
    <div className={`bg-white rounded-xl border px-4 py-3.5 flex items-center justify-between gap-3 transition-opacity ${section.isActive ? "border-stone-200" : "border-stone-100 opacity-60"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-stone-800">{section.label}</p>
          {!section.isActive && (
            <span className="text-xs bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">Disembunyikan</span>
          )}
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          {SECTION_DESCRIPTIONS[section.sectionKey] ?? ""}
        </p>
      </div>
      <button
        onClick={() => onToggle(section.sectionKey, section.isActive)}
        disabled={loading}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${section.isActive ? "bg-stone-800" : "bg-stone-300"}`}
        title={section.isActive ? "Nonaktifkan section" : "Aktifkan section"}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${section.isActive ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
