"use client";

import { useState } from "react";

const HEADING_FONTS = [
  "Cormorant",
  "Cormorant Garamond",
  "Playfair Display",
  "Great Vibes",
  "Cinzel",
  "Libre Baskerville",
  "Merriweather",
];

const BODY_FONTS = [
  "IBM Plex Sans",
  "Lato",
  "Montserrat",
  "Open Sans",
  "Raleway",
  "Poppins",
  "Source Sans Pro",
];

interface Theme {
  templateSlug: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
}

interface Props {
  clientId: string;
  initialTheme: Theme;
}

const labelClass = "block text-xs font-medium text-stone-600 mb-1";
const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

export function ThemeEditor({ clientId, initialTheme }: Props) {
  const [theme, setTheme] = useState<Theme>({ ...initialTheme, templateSlug: "dark" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof Theme>(key: K, value: Theme[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/clients/${clientId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, templateSlug: "dark" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan tema"); return; }
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">

        {/* Colors */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-5">Warna</h2>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Warna Utama" hint="Tombol, aksen, dekorasi"
              value={theme.primaryColor} onChange={(v) => update("primaryColor", v)} />
            <ColorField label="Warna Sekunder" hint="Background kartu, section"
              value={theme.secondaryColor} onChange={(v) => update("secondaryColor", v)} />
            <ColorField label="Background" hint="Warna dasar halaman"
              value={theme.bgColor} onChange={(v) => update("bgColor", v)} />
            <ColorField label="Warna Teks" hint="Teks utama konten"
              value={theme.textColor} onChange={(v) => update("textColor", v)} />
          </div>
        </div>

        {/* Fonts */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-1">Font</h2>
          <p className="text-xs text-stone-400 mb-5">Font heading dipakai untuk nama pengantin dan judul section</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Font Heading</label>
              <select value={theme.fontHeading} onChange={(e) => update("fontHeading", e.target.value)} className={inputClass}>
                {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {theme.fontHeading && (
                <p className="text-stone-400 text-xs mt-2 italic" style={{ fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                  Contoh: Groom &amp; Bride
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Font Body</label>
              <select value={theme.fontBody} onChange={(e) => update("fontBody", e.target.value)} className={inputClass}>
                {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {theme.fontBody && (
                <p className="text-stone-400 text-xs mt-2" style={{ fontFamily: `'${theme.fontBody}', sans-serif` }}>
                  Contoh: Dengan hormat kami mengundang
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : success ? "Tersimpan!" : "Simpan Tema"}
        </button>
      </div>

      {/* Preview sidebar */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-stone-200 overflow-hidden sticky top-6">
          <div className="px-4 py-3 bg-white border-b border-stone-100">
            <h3 className="font-semibold text-stone-800 text-sm">Preview</h3>
          </div>
          {/* Dark Elegance mini preview */}
          <div className="p-5 text-center" style={{ background: "#1a1a1a" }}>
            <div
              className="rounded-xl px-4 py-4 text-center mb-4 mx-2"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p className="text-xs italic mb-1" style={{ color: "rgba(255,255,255,0.6)", fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                The Wedding Of
              </p>
              <p className="text-xl font-light" style={{ color: "#fff", fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                Groom &amp; Bride
              </p>
            </div>
            <div className="h-px w-8 mx-auto mb-3" style={{ backgroundColor: theme.primaryColor, opacity: 0.6 }} />
            <p className="text-xs font-light mb-3" style={{ color: "rgba(255,255,255,0.5)", fontFamily: `'${theme.fontBody}', sans-serif` }}>
              Dengan hormat kami mengundang
            </p>
            <div className="rounded-xl p-3 mb-3" style={{ background: "#242424" }}>
              <p className="text-xs font-light" style={{ color: theme.primaryColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                Detail Acara
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: `'${theme.fontBody}', sans-serif` }}>
                Sabtu, 1 Februari 2025
              </p>
            </div>
            <button className="px-4 py-1.5 rounded-full text-xs text-white" style={{ background: theme.primaryColor, color: "#1a1a1a" }}>
              Buka Undangan
            </button>
          </div>
          <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
            <p className="text-xs text-stone-400 text-center">Preview kasar — lihat undangan langsung untuk hasil sebenarnya</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, hint, value, onChange }: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm font-mono focus:outline-none bg-transparent" maxLength={7} />
      </div>
      <p className="text-xs text-stone-400 mt-1">{hint}</p>
    </div>
  );
}
