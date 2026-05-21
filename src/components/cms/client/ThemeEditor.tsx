"use client";

import { useState } from "react";

const HEADING_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Cinzel",
  "Libre Baskerville",
  "Merriweather",
];

const BODY_FONTS = [
  "Lato",
  "Montserrat",
  "Open Sans",
  "Raleway",
  "Poppins",
  "Source Sans Pro",
];

interface Theme {
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
  const [theme, setTheme] = useState<Theme>(initialTheme);
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
        body: JSON.stringify(theme),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan tema");
        return;
      }
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-5">Warna</h2>
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Warna Utama"
              hint="Tombol, aksen, dekorasi"
              value={theme.primaryColor}
              onChange={(v) => update("primaryColor", v)}
            />
            <ColorField
              label="Warna Sekunder"
              hint="Background kartu, section"
              value={theme.secondaryColor}
              onChange={(v) => update("secondaryColor", v)}
            />
            <ColorField
              label="Background"
              hint="Warna dasar halaman"
              value={theme.bgColor}
              onChange={(v) => update("bgColor", v)}
            />
            <ColorField
              label="Warna Teks"
              hint="Teks utama konten"
              value={theme.textColor}
              onChange={(v) => update("textColor", v)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-5">Font</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Font Heading</label>
              <select
                value={theme.fontHeading}
                onChange={(e) => update("fontHeading", e.target.value)}
                className={inputClass}
              >
                {HEADING_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Font Body</label>
              <select
                value={theme.fontBody}
                onChange={(e) => update("fontBody", e.target.value)}
                className={inputClass}
              >
                {BODY_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : success ? "Tersimpan!" : "Simpan Tema"}
        </button>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-6">
          <h3 className="font-semibold text-stone-800 mb-4 text-sm">Preview</h3>
          <div
            className="rounded-xl overflow-hidden border border-stone-100"
            style={{ backgroundColor: theme.bgColor }}
          >
            <div
              className="h-2"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div className="p-5 text-center">
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{ color: theme.textColor, opacity: 0.5 }}
              >
                Undangan Pernikahan
              </p>
              <p
                className="text-2xl mb-1"
                style={{
                  fontFamily: `'${theme.fontHeading}', Georgia, serif`,
                  color: theme.textColor,
                }}
              >
                Groom
              </p>
              <p style={{ color: theme.primaryColor }}>&amp;</p>
              <p
                className="text-2xl mb-4"
                style={{
                  fontFamily: `'${theme.fontHeading}', Georgia, serif`,
                  color: theme.textColor,
                }}
              >
                Bride
              </p>
              <div
                className="rounded-lg p-3 mb-3"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                <p
                  className="text-xs"
                  style={{
                    fontFamily: `'${theme.fontBody}', sans-serif`,
                    color: theme.textColor,
                  }}
                >
                  Sabtu, 1 Februari 2025
                  <br />
                  Gedung Serbaguna
                </p>
              </div>
              <button
                className="px-4 py-1.5 rounded-full text-xs text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Buka Undangan
              </button>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3 text-center">
            Preview kasar — lihat undangan langsung untuk hasil sebenarnya
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm font-mono focus:outline-none bg-transparent"
          maxLength={7}
        />
      </div>
      <p className="text-xs text-stone-400 mt-1">{hint}</p>
    </div>
  );
}
