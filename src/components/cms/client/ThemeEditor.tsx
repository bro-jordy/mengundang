"use client";

import { useState } from "react";
import { Check } from "lucide-react";

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

interface Template {
  slug: string;
  name: string;
  description: string;
  tag: string;
  tagColor: string;
  preview: React.ReactNode;
  defaultColors: { primaryColor: string; secondaryColor: string; bgColor: string; textColor: string };
  defaultFonts: { fontHeading: string; fontBody: string };
}

const TEMPLATES: Template[] = [
  {
    slug: "dark",
    name: "Dark Elegance",
    description: "Minimalis modern dengan latar gelap, aksen emas hangat, dan tipografi elegan",
    tag: "Modern",
    tagColor: "#c4a07a",
    defaultColors: { primaryColor: "#c4a07a", secondaryColor: "#f5f5f5", bgColor: "#ffffff", textColor: "#1a1a1a" },
    defaultFonts: { fontHeading: "Cormorant", fontBody: "IBM Plex Sans" },
    preview: (
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px", letterSpacing: "0.2em", marginBottom: "4px" }}>The Wedding Of</p>
          <p style={{ color: "#fff", fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 300 }}>Groom &amp; Bride</p>
        </div>
        <div style={{ height: "1px", width: "24px", background: "linear-gradient(90deg,transparent,#c4a07a,transparent)", margin: "0 auto" }} />
        <div style={{ background: "#242424", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
          <p style={{ color: "#c4a07a", fontSize: "9px", fontFamily: "Georgia, serif" }}>Detail Acara</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "8px", marginTop: "2px" }}>Sabtu, 1 Februari 2026</p>
        </div>
      </div>
    ),
  },
  {
    slug: "classic",
    name: "Classic Ivory",
    description: "Tradisional elegan dengan warna gading, dekorasi serif, dan kesan hangat romantis",
    tag: "Klasik",
    tagColor: "#b8860b",
    defaultColors: { primaryColor: "#b8860b", secondaryColor: "#f5f0e8", bgColor: "#fffdf7", textColor: "#3d3d3d" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fffdf7", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px solid #f0e8d8" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <p style={{ color: "#888", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase" }}>Undangan Pernikahan</p>
          <p style={{ color: "#3d3d3d", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 700 }}>Groom</p>
          <p style={{ color: "#b8860b", fontSize: "14px" }}>&amp;</p>
          <p style={{ color: "#3d3d3d", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 700 }}>Bride</p>
        </div>
        <div style={{ height: "1px", width: "32px", background: "#b8860b", opacity: 0.5 }} />
        <p style={{ color: "#b8860b", fontSize: "8px", letterSpacing: "0.15em" }}>Sabtu, 1 Februari 2026</p>
      </div>
    ),
  },
  {
    slug: "sage",
    name: "Sage Editorial",
    description: "Pinterest masonry gallery, horizontal scroll snap, animasi stagger elegan, nuansa sage green & cream",
    tag: "Editorial ✦",
    tagColor: "#7c9a7e",
    defaultColors: { primaryColor: "#7c9a7e", secondaryColor: "#f2efe9", bgColor: "#fafaf8", textColor: "#1e1e1c" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fafaf8", borderRadius: "12px", padding: "1rem", minHeight: "130px", border: "1px solid #e8e2d9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", height: "90px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ flex: 2, background: "#e8e2d9", borderRadius: "6px" }} />
            <div style={{ flex: 1, background: "#f2efe9", borderRadius: "6px", border: "1px solid #e8e2d9" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
            <div style={{ flex: 1, background: "#f2efe9", borderRadius: "6px", border: "1px solid #e8e2d9" }} />
            <div style={{ flex: 2, background: "#e8e2d9", borderRadius: "6px" }} />
          </div>
        </div>
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ height: "2px", width: "16px", background: "#7c9a7e", borderRadius: "1px" }} />
          <p style={{ color: "#1e1e1c", fontFamily: "Georgia,serif", fontSize: "11px", fontStyle: "italic" }}>Sage Editorial</p>
        </div>
      </div>
    ),
  },
  {
    slug: "pearl",
    name: "Pearl Luxury",
    description: "Mewah modern dengan animasi Framer Motion, galeri sinematik, dan estetika champagne gold",
    tag: "Luxury ✦",
    tagColor: "#c9a96e",
    defaultColors: { primaryColor: "#c9a96e", secondaryColor: "#f5ede0", bgColor: "#fdf8f3", textColor: "#3d2e28" },
    defaultFonts: { fontHeading: "Cormorant Garamond", fontBody: "Lato" },
    preview: (
      <div style={{ background: "linear-gradient(135deg, #fdf8f3 0%, #f5ede0 100%)", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", border: "1px solid #e8d8c055" }}>
        <div style={{ height: "1px", width: "40px", background: "linear-gradient(90deg,transparent,#c9a96e,transparent)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#c9a96e", fontSize: "8px", letterSpacing: "0.3em", fontStyle: "italic", marginBottom: "4px" }}>The Wedding Of</p>
          <p style={{ color: "#3d2e28", fontFamily: "Georgia, serif", fontSize: "17px", fontWeight: 300 }}>Groom &amp; Bride</p>
        </div>
        <div style={{ height: "1px", width: "32px", background: "linear-gradient(90deg,transparent,#c9a96e,transparent)" }} />
        <div style={{ background: "rgba(201,169,110,0.15)", borderRadius: "9999px", padding: "4px 16px", border: "1px solid #c9a96e55" }}>
          <p style={{ color: "#c9a96e", fontSize: "8px", fontWeight: 600, letterSpacing: "0.2em" }}>BUKA UNDANGAN</p>
        </div>
      </div>
    ),
  },
  {
    slug: "envelope",
    name: "Envelope Journey",
    description: "Pengalaman membuka amplop mewah 3D, animasi sinematik, galeri polaroid scrapbook, dan scroll dua arah",
    tag: "Premium ✦✦",
    tagColor: "#c4954a",
    defaultColors: { primaryColor: "#c4954a", secondaryColor: "#f4ece0", bgColor: "#faf8f4", textColor: "#332820" },
    defaultFonts: { fontHeading: "Cormorant Garamond", fontBody: "Jost" },
    preview: (
      <div style={{ background: "radial-gradient(ellipse at 50% 40%, #f8f0e2 0%, #ede0c6 100%)", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", position: "relative", overflow: "hidden" }}>
        {/* Mini envelope */}
        <div style={{ position: "relative", width: "72px", height: "50px" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg, #f4e9d3, #e9d9b8)", borderRadius: "2px", boxShadow: "0 4px 12px rgba(61,40,20,0.2)" }} />
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 50% 55%)", background: "linear-gradient(to bottom, #f6eedb, #e8d7b4)" }} />
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #d4a843, #9e6d26)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#c4954a", fontSize: "7px", letterSpacing: "0.3em", fontFamily: "Georgia,serif", marginBottom: "3px" }}>✦ Wedding Invitation ✦</p>
          <p style={{ color: "#332820", fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 300 }}>Groom &amp; Bride</p>
        </div>
        <div style={{ height: "1px", width: "28px", background: "linear-gradient(90deg,transparent,#c4954a,transparent)" }} />
      </div>
    ),
  },
  {
    slug: "lucky-jackpot",
    name: "Lucky Jackpot",
    description: "Opening animasi mesin fortune mewah — 8826 bertransformasi menjadi 888, simbol keberuntungan berlipat ganda",
    tag: "Fortune ✦✦✦",
    tagColor: "#c9a84c",
    defaultColors: { primaryColor: "#c9a84c", secondaryColor: "#fdf3d0", bgColor: "#fdf9f0", textColor: "#2d1f0a" },
    defaultFonts: { fontHeading: "Cormorant Garamond", fontBody: "Lato" },
    preview: (
      <div style={{ background: "linear-gradient(135deg, #fdf9f0 0%, #f5e9c8 100%)", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px solid #c9a84c33" }}>
        <p style={{ color: "#8b6914", fontSize: "8px", letterSpacing: "0.28em", fontFamily: "Georgia,serif", textTransform: "uppercase" }}>✦ Fortune ✦</p>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {["8", "8", "8"].map((d, i) => (
            <div key={i} style={{ width: "22px", height: "26px", background: "linear-gradient(135deg,#fef9ed,#fdf3d0)", border: "1.5px solid #c9b87a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: "bold", color: "#8b6914" }}>{d}</span>
            </div>
          ))}
        </div>
        <p style={{ color: "#2d1f0a", fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 300 }}>Groom &amp; Bride</p>
        <p style={{ color: "#c9a84c", fontSize: "7px", letterSpacing: "0.2em", fontStyle: "italic", fontFamily: "Georgia,serif" }}>✦ The Ultimate Jackpot ✦</p>
      </div>
    ),
  },
];

interface Theme {
  templateSlug: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
  showMap: boolean;
  barcodeVisibility: "ALWAYS" | "AFTER_RSVP" | "HIDDEN";
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

  function selectTemplate(tpl: Template) {
    setTheme((prev) => ({
      ...prev,
      templateSlug: tpl.slug,
      ...tpl.defaultColors,
      ...tpl.defaultFonts,
    }));
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
      if (!res.ok) { setError(data.error || "Gagal menyimpan tema"); return; }
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  const activeTemplate = TEMPLATES.find((t) => t.slug === theme.templateSlug) ?? TEMPLATES[0];

  return (
    <div className="space-y-6">

      {/* Template selector */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-1">Pilih Tema Undangan</h2>
        <p className="text-xs text-stone-400 mb-5">Setiap tema memiliki desain, animasi, dan nuansa yang berbeda</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => {
            const isActive = theme.templateSlug === tpl.slug;
            return (
              <button
                key={tpl.slug}
                onClick={() => selectTemplate(tpl)}
                className="relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-md"
                style={{
                  borderColor: isActive ? tpl.tagColor : "#e7e5e4",
                  boxShadow: isActive ? `0 0 0 1px ${tpl.tagColor}55, 0 8px 24px ${tpl.tagColor}18` : undefined,
                }}
              >
                {/* Preview */}
                <div className="p-3">
                  {tpl.preview}
                </div>

                {/* Info */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-stone-800 text-sm">{tpl.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${tpl.tagColor}18`, color: tpl.tagColor }}>
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{tpl.description}</p>
                </div>

                {/* Active check */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: tpl.tagColor }}>
                    <Check size={12} color="#fff" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Colors */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Warna</h2>
            <p className="text-xs text-stone-400 mb-5">Sesuaikan warna dengan tema undangan Anda</p>
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

          {/* Options */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Pengaturan Tampilan</h2>
            <p className="text-xs text-stone-400 mb-4">Pilih elemen yang ingin ditampilkan di undangan</p>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-stone-700">Tampilkan Peta Lokasi</p>
                  <p className="text-xs text-stone-400 mt-0.5">Tampilkan Google Maps interaktif di setiap lokasi acara</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("showMap", !theme.showMap)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                  style={{ background: theme.showMap ? "#292524" : "#d6d3d1" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: theme.showMap ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </label>

              <div className="border-t border-stone-100 pt-4">
                <div className="mb-2">
                  <p className="text-sm font-medium text-stone-700">Kapan Barcode Tiket Ditampilkan</p>
                  <p className="text-xs text-stone-400 mt-0.5">Atur kapan QR code e-tiket muncul di undangan tamu</p>
                </div>
                <select
                  value={theme.barcodeVisibility}
                  onChange={(e) => update("barcodeVisibility", e.target.value as Theme["barcodeVisibility"])}
                  className={inputClass}
                >
                  <option value="AFTER_RSVP">Muncul setelah tamu konfirmasi kehadiran (RSVP)</option>
                  <option value="ALWAYS">Selalu tampil tanpa perlu RSVP terlebih dahulu</option>
                  <option value="HIDDEN">Tidak tampilkan barcode sama sekali</option>
                </select>
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
            {saving ? "Menyimpan..." : success ? "✓ Tersimpan!" : "Simpan Tema"}
          </button>
        </div>

        {/* Live mini-preview sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-stone-200 overflow-hidden sticky top-6">
            <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800 text-sm">Preview</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${activeTemplate.tagColor}18`, color: activeTemplate.tagColor }}>
                {activeTemplate.name}
              </span>
            </div>
            <div className="p-4" style={{ background: theme.bgColor }}>
              <div className="rounded-xl overflow-hidden mb-3" style={{ background: theme.bgColor }}>
                {/* Header bubble */}
                <div className="rounded-xl p-4 text-center mb-3"
                  style={{ background: theme.templateSlug === "dark" ? "#1a1a1a" : theme.secondaryColor, border: `1px solid ${theme.primaryColor}33` }}>
                  <p className="text-xs italic mb-1"
                    style={{ color: theme.templateSlug === "dark" ? "rgba(255,255,255,0.6)" : theme.primaryColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    The Wedding Of
                  </p>
                  <p className="text-lg font-light"
                    style={{ color: theme.templateSlug === "dark" ? "#fff" : theme.textColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    Groom &amp; Bride
                  </p>
                </div>
                <div className="h-px w-8 mx-auto mb-3" style={{ background: `linear-gradient(90deg,transparent,${theme.primaryColor},transparent)` }} />
                <p className="text-xs font-light text-center mb-3"
                  style={{ color: theme.templateSlug === "dark" ? "rgba(0,0,0,0.5)" : theme.textColor + "80", fontFamily: `'${theme.fontBody}', sans-serif` }}>
                  Dengan hormat kami mengundang
                </p>
                <div className="rounded-xl p-3 mb-3"
                  style={{ background: theme.templateSlug === "dark" ? "#242424" : theme.secondaryColor }}>
                  <p className="text-xs font-light text-center"
                    style={{ color: theme.primaryColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    Detail Acara
                  </p>
                  <p className="text-xs mt-1 text-center"
                    style={{ color: theme.templateSlug === "dark" ? "rgba(255,255,255,0.5)" : theme.textColor + "70", fontFamily: `'${theme.fontBody}', sans-serif` }}>
                    Sabtu, 1 Februari 2026
                  </p>
                </div>
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: theme.primaryColor, color: theme.templateSlug === "pearl" ? "#3d2e28" : "#fff" }}>
                    Buka Undangan
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
              <p className="text-xs text-stone-400 text-center">Preview kasar — lihat undangan untuk hasil sebenarnya</p>
            </div>
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
