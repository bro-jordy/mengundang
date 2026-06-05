"use client";

import { QRCodeSVG } from "qrcode.react";

interface BarcodeItem {
  code: string;
  label: string;
  sublabel: string;
}

interface Props {
  barcodeChurch: string | null;
  barcodeReception: string | null;
  invitationCategory: "GEREJA_SAJA" | "GEREJA_RESEPSI";
  /** Human-readable label for the first barcode, e.g. "Akad", "Pemberkatan", "Sangjit" */
  churchLabel?: string;
  /** Human-readable label for the second barcode, e.g. "Resepsi" */
  receptionLabel?: string;
  churchVenueName?: string;
  receptionVenueName?: string;
  primaryColor?: string;
  bgColor?: string;
  fontHeading?: string;
  lang?: "id" | "en";
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  AKAD: "Akad",
  PEMBERKATAN: "Pemberkatan",
  RESEPSI: "Resepsi",
  AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit",
  LAMARAN: "Lamaran",
};

const TR = {
  id: {
    eyebrow: "E-Tiket",
    heading: "Tiket Undangan",
    ticketPrefix: "Tiket Masuk",
    footer: "Tunjukkan tiket ini kepada petugas saat tiba di venue.",
  },
  en: {
    eyebrow: "E-Ticket",
    heading: "Invitation Ticket",
    ticketPrefix: "Entrance Ticket",
    footer: "Please show this ticket to the staff upon arrival at the venue.",
  },
} as const;

/** Convert an EventType enum value to a display label. */
export function getEventLabel(eventType: string): string {
  return EVENT_TYPE_LABEL[eventType] ?? eventType;
}

export function BarcodeSection({
  barcodeChurch,
  barcodeReception,
  invitationCategory,
  churchLabel = "Acara",
  receptionLabel = "Resepsi",
  churchVenueName = "Venue",
  receptionVenueName = "Resepsi",
  primaryColor = "#b8860b",
  bgColor = "#fffdf7",
  fontHeading = "Playfair Display",
  lang = "en",
}: Props) {
  if (!barcodeChurch) return null;

  const t = TR[lang];

  const items: BarcodeItem[] = [
    {
      code: barcodeChurch,
      label: `${t.ticketPrefix} – ${churchLabel}`,
      sublabel: churchVenueName,
    },
  ];

  if (invitationCategory === "GEREJA_RESEPSI" && barcodeReception) {
    items.push({
      code: barcodeReception,
      label: `${t.ticketPrefix} – ${receptionLabel}`,
      sublabel: receptionVenueName,
    });
  }

  return (
    <section className="py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-lg mx-auto text-center">
        <p
          className="text-xs tracking-[0.28em] uppercase mb-3"
          style={{ color: primaryColor }}
        >
          {t.eyebrow}
        </p>
        <h2
          className="text-3xl mb-10"
          style={{ fontFamily: `'${fontHeading}', Georgia, serif`, color: primaryColor }}
        >
          {t.heading}
        </h2>

        <div className={`flex ${items.length > 1 ? "gap-8 justify-center flex-wrap" : "justify-center"}`}>
          {items.map((item) => (
            <div
              key={item.code}
              className="flex flex-col items-center gap-4 bg-white rounded-2xl px-6 py-8 shadow-sm border"
              style={{ borderColor: `${primaryColor}30` }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase font-medium"
                style={{ color: primaryColor }}
              >
                {item.label}
              </p>

              <div className="p-3 rounded-xl" style={{ backgroundColor: `${primaryColor}10` }}>
                <QRCodeSVG
                  value={item.code}
                  size={160}
                  level="M"
                  fgColor={primaryColor}
                  bgColor="transparent"
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-stone-700">{item.sublabel}</p>
                <p className="text-xs text-stone-400 mt-1 font-mono">{item.code.slice(0, 8)}…</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400 mt-8">
          {t.footer}
        </p>
      </div>
    </section>
  );
}
