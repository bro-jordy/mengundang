"use client";

import { useState } from "react";
import { Copy, Check, Wallet, Gift, QrCode } from "lucide-react";

interface GiftItem {
  id: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  ewalletType: string | null;
  ewalletNumber: string | null;
  qrisImage: string | null;
  isActive: boolean;
}

interface Props {
  gifts: GiftItem[];
}

const BANK_THEMES: Record<string, { from: string; via: string; to: string }> = {
  BCA:     { from: "#005bac", via: "#0073d1", to: "#1a8fe0" },
  BNI:     { from: "#e65c00", via: "#f07a1a", to: "#f9a825" },
  MANDIRI: { from: "#003087", via: "#004abf", to: "#0057e0" },
  BRI:     { from: "#003087", via: "#0a4080", to: "#1a5276" },
  CIMB:    { from: "#b71c1c", via: "#c62828", to: "#e53935" },
  DANAMON: { from: "#880e4f", via: "#ad1457", to: "#e91e8c" },
  BSI:     { from: "#1b5e20", via: "#2d6a4f", to: "#40916c" },
  BTN:     { from: "#1b5e20", via: "#2e7d32", to: "#388e3c" },
  MEGA:    { from: "#0d47a1", via: "#1565c0", to: "#1976d2" },
  OCBC:    { from: "#b71c1c", via: "#d32f2f", to: "#f44336" },
};

function getBankTheme(name: string) {
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(BANK_THEMES)) {
    if (u.includes(k)) return v;
  }
  return { from: "#292524", via: "#44403c", to: "#57534e" };
}

function groupNumber(num: string) {
  const clean = num.replace(/\D/g, "");
  return clean.match(/.{1,4}/g)?.join("  ") ?? num;
}

function ChipSVG() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
      <rect width="44" height="34" rx="5" fill="#D4AF37" />
      <rect x="1" y="1" width="42" height="32" rx="4" fill="url(#chipGrad)" />
      <line x1="14" y1="0" x2="14" y2="34" stroke="#B8960C" strokeWidth="0.8" />
      <line x1="30" y1="0" x2="30" y2="34" stroke="#B8960C" strokeWidth="0.8" />
      <line x1="0" y1="11" x2="44" y2="11" stroke="#B8960C" strokeWidth="0.8" />
      <line x1="0" y1="23" x2="44" y2="23" stroke="#B8960C" strokeWidth="0.8" />
      <rect x="14" y="11" width="16" height="12" rx="2" fill="#C9A227" />
      <rect x="16" y="13" width="12" height="8" rx="1" fill="#D4AF37" />
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8C84A" />
          <stop offset="1" stopColor="#B8960C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ContactlessIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 Q20 8 12 14 Q4 8 12 2Z" fill="white" fillOpacity="0.3"/>
      <path d="M12 5 Q18 10 12 15 Q6 10 12 5Z" fill="white" fillOpacity="0.5"/>
      <path d="M12 8 Q16 11 12 14 Q8 11 12 8Z" fill="white" fillOpacity="0.8"/>
      <circle cx="12" cy="16.5" r="1.2" fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

export function GiftSection({ gifts }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  const active = gifts.filter((g) => g.isActive);
  if (active.length === 0) return null;

  const banks   = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">
            Hadiah Pernikahan
          </p>
          <h2 className="font-heading text-3xl text-stone-800">Amplop Digital</h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-4" />
          <p className="text-sm text-stone-500 mt-4 max-w-xs mx-auto">
            Doa restu Anda adalah hadiah terbaik bagi kami. Namun jika berkenan
            memberikan hadiah, berikut informasinya.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Bank ATM cards ── */}
          {banks.map((gift) => {
            const theme = getBankTheme(gift.bankName || "");
            const copyKey = `bank-${gift.id}`;
            const isCopied = copiedId === copyKey;

            return (
              <div key={gift.id} className="relative" style={{ perspective: "1000px" }}>
                {/* Card */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 50%, ${theme.to} 100%)`,
                    aspectRatio: "1.586 / 1",
                    minHeight: "190px",
                  }}
                >
                  {/* Shine layer */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)",
                    }}
                  />
                  {/* Decorative circle top-right */}
                  <div
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                  <div
                    className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />

                  <div className="relative z-10 h-full flex flex-col justify-between p-5">
                    {/* Row 1: Bank name + contactless */}
                    <div className="flex items-start justify-between">
                      <span className="text-white font-bold text-lg tracking-wide uppercase drop-shadow">
                        {gift.bankName}
                      </span>
                      <ContactlessIcon />
                    </div>

                    {/* Row 2: Chip + label */}
                    <div className="flex items-center gap-3">
                      <ChipSVG />
                      <span className="text-white/50 text-xs uppercase tracking-widest">
                        Transfer Bank
                      </span>
                    </div>

                    {/* Row 3: Account number */}
                    <div>
                      <p className="text-white font-mono text-lg tracking-[0.2em] drop-shadow">
                        {groupNumber(gift.accountNumber || "")}
                      </p>
                    </div>

                    {/* Row 4: Name + copy button */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">
                          Atas Nama
                        </p>
                        <p className="text-white font-medium text-sm uppercase tracking-wide">
                          {gift.accountName}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(copyKey, gift.accountNumber || "")}
                        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/35 transition-colors rounded-lg px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm border border-white/20"
                      >
                        {isCopied ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── E-wallet cards ── */}
          {ewallets.map((gift) => {
            const copyKey = `ew-${gift.id}`;
            return (
              <div key={gift.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-xl shrink-0">
                    <Wallet size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 mb-0.5">E-Wallet</p>
                    <p className="font-semibold text-stone-800">{gift.ewalletType}</p>
                    <p className="text-stone-600 font-mono text-sm mt-0.5">{gift.ewalletNumber}</p>
                  </div>
                  <button
                    onClick={() => copy(copyKey, gift.ewalletNumber || "")}
                    className="shrink-0 p-2.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    {copiedId === copyKey ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            );
          })}

          {/* ── QRIS cards ── */}
          {qrisList.map((gift) => (
            <div key={gift.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-xl shrink-0">
                    <QrCode size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">QRIS</p>
                    <p className="font-semibold text-stone-800">
                      {gift.ewalletType || gift.bankName || "Scan QR Code"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  {qrisOpen === gift.id ? "Tutup" : "Lihat QR"}
                </button>
              </div>
              {qrisOpen === gift.id && (
                <div className="px-5 pb-5 flex flex-col items-center border-t border-stone-50 pt-4">
                  <img
                    src={gift.qrisImage!}
                    alt="QRIS"
                    className="max-w-[200px] w-full rounded-xl border border-stone-200"
                  />
                  <p className="text-xs text-stone-400 mt-2">Scan untuk transfer</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Gift size={20} className="text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-stone-400">
            Terima kasih atas perhatian dan kasih sayang Anda
          </p>
        </div>
      </div>
    </section>
  );
}
